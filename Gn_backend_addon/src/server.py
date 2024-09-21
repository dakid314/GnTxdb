import os
import re
import uuid
import datetime
from multiprocessing import Process, Lock, Queue
import argparse
import json
from io import StringIO
import traceback
from hashlib import sha512
from datetime import datetime, timezone
import time
from threading import Thread
import base64
import random
import requests
import subprocess

from flask import abort, jsonify, Flask, request, Response, redirect
from flask import make_response, send_from_directory
from Bio import SeqIO, SeqRecord, Seq
import numpy as np


app = Flask(__name__)

min_lengthseq = 10
max_seqnum = int(os.environ['MAX_SEQ_NUM'])


class EmailNotifier:
    def __init__(self, emailserver_url: str = None, emailserver_token: str = None, emailsender: str = None) -> None:
        self.emailserver_url = emailserver_url
        self.emailserver_token = emailserver_token
        self.emailsender = emailsender
        pass

    def html_only(self, to: str, html_content: str):
        if self.emailserver_url is None or self.emailserver_token is None or self.emailsender is None:
            return
        resp_ = None
        while resp_ is None or resp_.status_code != 200:
            with requests.Session() as s:
                resp_ = s.send(
                    requests.Request(
                        "POST",
                        os.path.join(self.emailserver_url,
                                     *["api", "mailsender"]),
                        json={
                            "from": {
                                "name": os.environ['EMAIL_Displayname'],
                                "address": self.emailsender
                            },
                            "to": [
                                to
                            ],
                            "subject": "TxSEml Notification",
                            "header": {
                                "List-Unsubscribe": "<about:blank>"
                            },
                            "body": [
                                {
                                    "Content-Type": "text/html",
                                    "content": f'<html><head><meta charset="utf-8"></head><body>{html_content}</body></html>'
                                }
                            ]
                        },
                        auth=("", self.emailserver_token)
                    ).prepare(),
                    verify=False,
                    allow_redirects=False
                )

    def html_template(self, to: str, path_to_html: str, formatargs: dict):
        html_template_ = None
        with open(path_to_html, "r", encoding='UTF-8') as f:
            html_template_ = f.read()
        html_template_ = html_template_.format(**formatargs)
        self.html_only(to, html_template_)



libpath = os.path.join(os.path.abspath('.'),'GnTxSPdb')

@app.route("/GnTxSPdb")
def root():
    return send_from_directory( libpath,'index.html', as_attachment=False)

@app.route("/<path:file_path>/<filename>",methods=['GET', ])
def index_page_file(file_path, filename):
    full_path = file_path + '/' + filename
    return send_from_directory('../', full_path, as_attachment=False)


@app.route("/api/job_submit", methods=['POST', ])
def api_job_submit_func():
    data_dir = None
    try:
        req_args = json.loads(request.data)
        ##################################################
        req_args['jobid']
        req_args['fasta_data']
        req_args['prottype']
        req_args['email']
        ##################################################
        if re.match('^[0-9a-zA-Z][-0-9a-zA-Z]*@[0-9a-zA-Z][-0-9a-zA-Z]*(\.[-0-9a-zA-Z]+)+$', req_args['email']) is None:
            raise RuntimeError(f"Wrong Mail format.", 5)

        now_utc = datetime.now(timezone.utc)
        req_args['upload_timestamp'] = now_utc.timestamp()
        req_args['upload_time'] = now_utc.strftime('%Y-%m-%dT%H:%M:%SZ')
        data_dir = f"{os.environ['USER_DIR']}/{sha512(req_args['jobid'].encode()).hexdigest()}"

        file_exist_Lock.acquire()
        if os.path.exists(data_dir) == False:
            os.makedirs(data_dir)
            file_exist_Lock.release()
        else:
            file_exist_Lock.release()
            if app.config['isinDEBUG'] == True:
                with open(f'{data_dir}/state', 'w+', encoding='UTF-8') as statef:
                    statef.write('pendding')
                jobid_queue_lock.acquire()
                jobid_queue.append(req_args['jobid'])
                jobid_queue_lock.release()
                return json.dumps({
                    "code": 0,
                    "func": 'api_job_submit_func',
                    "msg": '',
                    "data": {
                        "jobid": req_args['jobid'],
                        'hashed:jobid': sha512(
                            req_args['jobid'].encode()).hexdigest()
                    }
                })
            raise RuntimeError(
                f"Found Exist JobID: {req_args['jobid']}, Please Refesh the Page.", 2)
        if len(req_args['fasta_data']) > max_seqnum:
            raise ValueError(
                f"number of sequences should not be more than {max_seqnum}", 4)
        for seqitem in req_args['fasta_data']:
            if len(seqitem['seq_string']) < min_lengthseq:
                raise ValueError(
                    f"Sequence Length should be longer than {min_lengthseq}", 3)
        for index, seqitem in enumerate(req_args['fasta_data']):
            for cc in seqitem['seq_string']:
                if cc not in 'ACDEFGHIKLMNPQRSTVWY':
                    raise ValueError(
                        f"Found illegal char in the {index} sequence.", 9)

        with open(f'{data_dir}/seq.fasta', 'w+', encoding='UTF-8') as seqf:
            SeqIO.write(
                [
                    SeqRecord.SeqRecord(
                        Seq.Seq(
                            seqitem['seq_string']),
                        description=seqitem['desc'] if 'desc' in seqitem else '',
                        id=seqitem['name']
                    )
                    for seqitem in req_args['fasta_data']
                ], seqf, "fasta"
            )

        del req_args['fasta_data']

        with open(f'{data_dir}/args.json', 'w+', encoding='UTF-8') as jsonf:
            json.dump(req_args, jsonf)
        with open(f'{data_dir}/state', 'w+', encoding='UTF-8') as statef:
            statef.write('pendding')

        jobid_queue_lock.acquire()
        jobid_queue.append(req_args['jobid'])
        jobid_queue_lock.release()

        # emailnotifier.html_template(
        #     to=req_args['email'],
        #     path_to_html=f"{os.environ['LIB_DIR']}/email_template/emailtemplate.html",
        #     formatargs={
        #         "jobid": req_args['jobid'],
        #         "msg": "You have successfully submitted the job, please remember your JobID, this is the only identification string you can query your job results."
        #     }
        # )
        return json.dumps({
            "code": 0,
            "func": 'api_job_submit_func',
            "msg": '',
            "data": {
                "jobid": req_args['jobid'],
                'hashed:jobid': sha512(
                    req_args['jobid'].encode()).hexdigest()
            }
        })
    except Exception as errorobj:
        if len(errorobj.args) == 1:
            errorobj.args = (errorobj.args[0], 1)
        if app.config['isinDEBUG'] == False and data_dir is not None:
            if os.path.exists(data_dir) == True:
                # os.removedirs(data_dir)
                # os.rmdir(data_dir)
                pass
        return json.dumps({
            "code": errorobj.args[1],
            "func": 'api_job_submit_func',
            "msg": f'{type(errorobj).__name__}: {errorobj.args[0]}',
            "errdetail": "".join(traceback.format_exception(type(errorobj), errorobj, errorobj.__traceback__)),
            "data": None
        })


@app.route("/api/job_status", methods=['GET', ])
def api_job_status_func():
    req_args = request.args
    data_dir = f"{os.environ['USER_DIR']}/{sha512(req_args['jobid'].encode()).hexdigest()}"
    state = None
    if os.path.exists(f'{data_dir}/state') == False:
        return json.dumps({
            "code": 2,
            "func": 'api_job_status_func',
            "msg": f'Can\'t FIND the JOBid: {req_args["jobid"]}',
            "data": None
        })

    with open(f'{data_dir}/state', 'r', encoding='UTF-8') as statef:
        state = statef.read()
    if state == 'complete' or state == 'running':
        return {
            "code": 0,
            "func": 'api_job_status_func',
            "msg": '',
            "data": {
                "jobid": request.args['jobid'],
                'status': state,
                'number': None,
                'file': os.listdir(data_dir)
            }
        }
    # pendding
    jobid_queue_lock.acquire()
    queuenum = None
    try:
        queuenum = jobid_queue.index(req_args['jobid'])
    except ValueError as e:
        queuenum = -1
    jobid_queue_lock.release()
    if queuenum < 0:
        return json.dumps({
            "code": 1,
            "func": 'api_job_status_func',
            "msg": 'Your Job not in queue. reTry to sumbit job will help.',
            "data": {
                "jobid": request.args['jobid'],
                'status': 'nofound',
                'number': len(jobid_queue)
            }
        })
    return json.dumps({
        "code": 0,
        "func": 'api_job_status_func',
        "msg": '',
        "data": {
            "jobid": request.args['jobid'],
            'status': state,
            'number': queuenum + 1
        }
    })


@app.route("/api/getNetworkstate")
def api_getNetworkstate_func():
    status = {}

    def try_url(url, name: str, status=status):
        try:
            status[name] = {"status": requests.get(url, timeout=(
                5, 30), verify=False).status_code, "url": url}
        except requests.Timeout as e:
            status[name] = {"status": 'timeout', "url": url}
        return
    try_url("https://possum.erc.monash.edu/submission", "POSSUM")
    try_url("https://web.expasy.org/cgi-bin/protparam/protparam", "Expasy")
    try_url("http://bliulab.net/DistanceSVM/Receive.jsp", "DistanceSVM")

    return json.dumps({
        "code": 0,
        "func": 'api_getResult_func',
        "msg": '',
        "data": {
            'status': status,
        }
    })


@app.route("/api/restartjob")
def api_restartjob_func():
    data_dir = None
    try:
        req_args = request.args
        data_dir = f"{os.environ['USER_DIR']}/{sha512(req_args['jobid'].encode()).hexdigest()}"
        with open(f'{data_dir}/state', 'w+', encoding='UTF-8') as statef:
            statef.write('pendding')
        jobid_queue_lock.acquire()
        jobid_queue.append(req_args['jobid'])
        jobid_queue_lock.release()
        return json.dumps({
            "code": 0,
            "func": 'api_restartjob_func',
            "msg": '',
            "data": {
                "jobid": req_args['jobid'],
                'hashed:jobid': sha512(
                    req_args['jobid'].encode()).hexdigest()
            }
        })
    except Exception as errorobj:
        if len(errorobj.args) == 1:
            errorobj.args = (errorobj.args[0], 1)
        return json.dumps({
            "code": errorobj.args[1],
            "func": 'api_restartjob_func',
            "msg": f'{type(errorobj).__name__}: {errorobj.args[0]}',
            "errdetail": "".join(traceback.format_exception(type(errorobj), errorobj, errorobj.__traceback__)),
            "data": None
        })


@app.route("/api/getResult")
def api_getResult_func():
    state = None
    data_dir = None
    try:
        req_args = request.args
        data_dir = f"{os.environ['USER_DIR']}/{sha512(req_args['jobid'].encode()).hexdigest()}"
        with open(os.path.join(data_dir, 'state'), 'r', encoding='UTF-8') as statef:
            state = statef.read()
        if state != 'complete':
            return json.dumps({
                "code": 1,
                "func": 'api_getResult_func',
                "msg": 'Job has not completed. Try later please.',
                "data": {
                    "jobid": request.args['jobid'],
                    'status': state,
                    'file_list': None
                }
            })

        # Complete
        with open(os.path.join(data_dir, 'table.xlsx'), 'rb') as xlsxf, open(os.path.join(data_dir, 'table.json'), 'r') as jsonf:
            return json.dumps({
                "code": 0,
                "func": 'api_getResult_func',
                "msg": '',
                "data": {
                    "jobid": request.args['jobid'],
                    'status': state,
                    'file_list': {
                        'tablexlsx': base64.b64encode(xlsxf.read()).decode('utf-8'),
                        'tablejson': json.load(jsonf),
                    }
                }
            })
    except Exception as errorobj:
        if len(errorobj.args) == 1:
            errorobj.args = (errorobj.args[0], 1)
        return json.dumps({
            "code": errorobj.args[1],
            "func": 'api_getResult_func',
            "msg": f'{type(errorobj).__name__}: {errorobj.args[0]}',
            "errdetail": "".join(traceback.format_exception(type(errorobj), errorobj, errorobj.__traceback__)),
            "data": None
        })


def tasker_worker(jobid: str, mode):
    data_dir = f"{os.environ['USER_DIR']}/{sha512(jobid.encode()).hexdigest()}"
    print(f'start jobid: {jobid}')

    with open(f'{data_dir}/pyconfig.json', 'w+', encoding='UTF-8') as f:
        json.dump({
            "jobid": jobid,
        }, f)

    if os.environ['DEBUG'] == "1":
        print("data_dir:", data_dir)
    pips = subprocess.Popen(
        f"{os.environ['Driver_Python_PATH']} -u src/driver.py --config {data_dir}/pyconfig.json --m {mode}",
        shell=True,
        executable=os.environ['SHELL_PATH'],
        stdout=subprocess.PIPE,
        stdin=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    cstderr = pips.communicate()[1].decode('UTF-8')
    pips.wait()

    d = None
    with open(f'{data_dir}/args.json', 'r', encoding='UTF-8') as f:
        d = json.load(f)
        if 'error' not in d:
            d['error'] = []
    d['error'].append(cstderr)
    with open(f'{data_dir}/args.json', 'w+', encoding='UTF-8') as f:
        json.dump(d, f)

    print(f'stop jobid: {jobid}')
    return None


def consumer(mode):
    while True:
        jobid = None
        jobid_queue_lock.acquire()
        try:
            jobid = jobid_queue.pop(0)
        except IndexError:
            jobid_queue_lock.release()
            time.sleep(5.0)
            print(f'Sleep done')
            continue
        jobid_queue_lock.release()
        data_dir = f"{os.environ['USER_DIR']}/{sha512(jobid.encode()).hexdigest()}"

        with open(f'{data_dir}/args.json', 'r', encoding='UTF-8') as f:
            args_dict = json.load(f)

        proobj = Process(
            target=tasker_worker,
            args=(
                jobid,mode,
            )
        )

        print(f'Projstart jobid: {jobid}')
        with open(f"{data_dir}/state", 'w+', encoding='UTF-8') as statef:
            statef.write('running')
        # emailnotifier.html_template(
        #     to=args_dict['email'],
        #     path_to_html=f"{os.environ['LIB_DIR']}/email_template/emailtemplate.html",
        #     formatargs={
        #         "jobid": jobid,
        #         "msg": "Your Job has started."
        #     }
        # )
        proobj.start()
        proobj.join()
        # emailnotifier.html_template(
        #     to=args_dict['email'],
        #     path_to_html=f"{os.environ['LIB_DIR']}/email_template/emailtemplate.html",
        #     formatargs={
        #         "jobid": jobid,
        #         "msg": "Your Job has Finished."
        #     }
        # )

        with open(f"{data_dir}/state", 'w+', encoding='UTF-8') as statef:
            statef.write('complete')
        print(f'Projend jobid: {jobid}')


@app.route("/api/job_blast_submit", methods=['POST', ])
def start_consumer():
    mode = 'blast'
    Thread(target=consumer(mode), daemon=True).start()


if __name__ == '__main__':
    import os
    
    debug_mode = True if os.environ['DEBUG'] == "1" else False
    os.makedirs(os.environ['USER_DIR'], exist_ok=True)
    os.makedirs(os.environ['TMP_DIR'], exist_ok=True)
    app.config['JSON_AS_ASCII'] = False
    app.config['isinDEBUG'] = debug_mode

    emailnotifier = EmailNotifier(
        emailserver_url=os.environ['EMAIL_URL'],
        emailserver_token=os.environ['EMAIL_Token'],
        emailsender=os.environ['EMAIL_Username']
    )
    #################################################
    file_exist_Lock = Lock()
    jobid_queue = []
    jobid_queue_lock = Lock()
    #################################################

    app.run(
        host=os.environ['BINDADDRESS'],
        port=os.environ['BACKENDPORT'],
        debug=True
    )
