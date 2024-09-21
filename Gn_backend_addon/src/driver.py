import warnings
warnings.filterwarnings("ignore")

import sys
sys.path.append(".")
sys.path.append("src")
import os
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
import pickle

sys.path.append("txseml_backend_addon/src")
import libexec
import libmodel_addon

import libpybiofeature
import utils

from sklearn.preprocessing import MinMaxScaler
from flask import abort, jsonify, Flask, request, Response, redirect
from flask import make_response, send_from_directory
from Bio import SeqIO, SeqRecord, Seq
import numpy as np
import pandas as pd


def write_status(msg: str, path_to_dir: str, remove: bool = False):
    if remove == False:
        with open(os.path.join(path_to_dir, msg), "w+", encoding='UTF-8') as f:
            f.write(datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'))
    else:
        os.remove(os.path.join(path_to_dir, msg))


def seq_feature_fetcher(jobid, userdir):
    # From Web
    data_dir = os.path.join(userdir, sha512(
        jobid.encode()).hexdigest())

    prottype_choised = None
    with open(f"{data_dir}/args.json", "r", encoding="UTF-8") as f:
        prottype_choised = json.load(f)['prottype']

    # Check server avaliable.
    ### ... ####
    if "2" in prottype_choised or "6" in prottype_choised:
        print("POSSUM submit start")
        write_status("possum.run", data_dir)
        if os.environ['POSSUM_Online'] == "1":
            if os.path.exists(os.path.join(data_dir, "possum_n.json")) == False:
                libexec.possum_submiter.go_(
                    path_to_fasta=os.path.join(data_dir, "seq.fasta"),
                    path_to_json=os.path.join(data_dir, "possum_n.json"),
                    tag_name='submited',
                    cter=False,
                    verbose=False,
                    MaxLength=5000
                )
            print("POSSUM submit end")
            print("POSSUM download start")
            if os.path.exists(os.path.join(data_dir, "POSSUM_n.done")) == False:
                libexec.possum_submiter.get_command(
                    path_to_json=os.path.join(data_dir, "possum_n.json"),
                    path_to_out_dir=data_dir
                )
                write_status("POSSUM_n.done", data_dir)

        else:
            # if os.path.exists(os.path.join(data_dir, "possum_n.json")) == False:
            #     libexec.possum_runner.go(
            #         path_to_fasta=os.path.join(data_dir, "seq.fasta"),
            #         path_to_json=os.path.join(data_dir, "possum_n.json"),
            #         tag_name='submited',
            #         cter=True,
            #         MaxLength=5000,
            #         path_to_out_dir=data_dir,
            #         path_to_tmpdir=config['tmpdir'],
            #         path_to_blast=config['blastplusdir'],
            #         path_to_nr=config['nrfasta'],
            #         path_to_possum=config['possum'],
            #     )
            # if os.path.exists(os.path.join(data_dir, "possum_c.json")) == False:
            #     libexec.possum_runner.go(
            #         path_to_fasta=os.path.join(data_dir, "seq.fasta"),
            #         path_to_json=os.path.join(data_dir, "possum_c.json"),
            #         tag_name='submited',
            #         cter=True,
            #         MaxLength=5000,
            #         path_to_out_dir=data_dir,
            #         path_to_tmpdir=config['tmpdir'],
            #         path_to_blast=config['blastplusdir'],
            #         path_to_nr=config['nrfasta'],
            #         path_to_possum=config['possum'],
            #     )
            pass

        write_status("possum.run", data_dir, True)
        print("POSSUM download end")

    if "2" in prottype_choised:
        print("expasy start")
        write_status("expasy.run", data_dir,)
        if os.path.exists(os.path.join(data_dir, "expasy_n.done")) == False:
            libexec.expasy_submiter.go_on(
                path_to_save=os.path.join(data_dir, 'expasy_n.json'),
                path_to_fasta=os.path.join(data_dir, "seq.fasta"),
                lenght=100,
                cter=False,
            )
            with open(os.path.join(data_dir, "expasy_n.done"), "w+", encoding='UTF-8') as asdf:
                pass
        write_status("expasy.run", data_dir, True)
        print("expasy end")

    if "2" in prottype_choised or "6" in prottype_choised:
        print("topn start")
        if os.path.exists(os.path.join(data_dir, "topn_data.json")) == False:
            topn_data = libexec.Top_n_gram_data_submiter.get_feature(
                os.path.join(data_dir, "seq.fasta"),
            )

            topn_data_dict = {
                'data': {
                    'submited': topn_data,
                },
            }

            with open(os.path.join(data_dir, 'topn_data.json'), 'w+', encoding='UTF-8') as f:
                json.dump(
                    topn_data_dict,
                    f
                )
        print("topn end")
    return None


def seq_feature_runner(jobid: str, userdir: str):
    data_dir = os.path.join(userdir, sha512(
        jobid.encode()).hexdigest())

    prottype_choised = None
    with open(f"{data_dir}/args.json", "r", encoding="UTF-8") as f:
        prottype_choised = json.load(f)['prottype']

    # local
    if "2" in prottype_choised:
        print("bert_ss start")
        write_status("bert_ss.run", data_dir,)
        pips = subprocess.Popen(
            f"{os.environ['Bert_Python_PATH']} -u src/libbert/ss.py -f {data_dir}/seq.fasta -o {data_dir}/ss_n.pkl",
            shell=True,
            executable=os.environ['SHELL_PATH'],
            stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE
        )
        cstderr = pips.communicate()[1].decode('UTF-8')
        pips.wait()
        if cstderr != "":
            raise RuntimeError(
                f"protr PIP stderr: {cstderr};")
        write_status("bert_ss.run", data_dir, True)
        print("bert_ss end")
    if "6" in prottype_choised:
        print("bert_sa start")
        write_status("bert_sa.run", data_dir,)
        pips = subprocess.Popen(
            f"{os.environ['Bert_Python_PATH']} -u src/libbert/sa.py -f {data_dir}/seq.fasta -o {data_dir}/sa_n.pkl",
            shell=True,
            executable=os.environ['SHELL_PATH'],
            stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE
        )
        cstderr = pips.communicate()[1].decode('UTF-8')
        pips.wait()
        if cstderr != "":
            raise RuntimeError(
                f"protr PIP stderr: {cstderr};")
        write_status("bert_sa.run", data_dir, True)
        print("bert_sa end")
    if "2" in prottype_choised or "6" in prottype_choised:
        print("bert_diso start")
        write_status("bert_diso.run", data_dir,)
        pips = subprocess.Popen(
            f"{os.environ['Bert_Python_PATH']} -u src/libbert/diso.py -f {data_dir}/seq.fasta -o {data_dir}/diso_n.pkl",
            shell=True,
            executable=os.environ['SHELL_PATH'],
            stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE
        )
        cstderr = pips.communicate()[1].decode('UTF-8')
        pips.wait()
        if cstderr != "":
            raise RuntimeError(
                f"protr PIP stderr: {cstderr};")
        write_status("bert_diso.run", data_dir, True)
        print("bert_diso end")

    if "2" in prottype_choised or "6" in prottype_choised:
        print("pse-PC start")
        write_status("pse-PC.run", data_dir,)
        pips = subprocess.Popen(
            f"{os.environ['Python3_PATH']} -u {os.environ['PSE_PATH']}/src {data_dir}/seq.fasta {data_dir}/PCPSE.csv Protein PC-PseAAC -f csv -lamada 1 -w 0.5",
            shell=True,
            executable=os.environ['SHELL_PATH'],
            stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=subprocess.PIPE
        )
        cstderr = pips.communicate()[1].decode('UTF-8')
        pips.wait()
        if cstderr != "":
            raise RuntimeError(
                f"protr PIP stderr: {cstderr};")
        write_status("pse-PC.run", data_dir, True)
        print("pse-PC end")

    if "2" in prottype_choised:
        print("pairwisealigner start")
        write_status("pairwisealigner.run", data_dir,)
        if os.path.exists(os.path.join(data_dir, "pairwisealign.done")) == False:
            for t in [2,]:
                pairaligner_data = libexec.pairwisealigner.get_Score_Matrix_In_fasta(
                    os.path.join(data_dir, "seq.fasta"),
                    fasta_database=libexec.pairwisealigner.get_fasta_database([
                        os.path.join(os.environ['LIB_DIR'],
                                     *['ep3', f'db.t{t}.fasta']),
                    ])
                )
                pairaligner_dict = {
                    'name': f"submited_{t}",
                    'data': pairaligner_data
                }
                with open(os.path.join(data_dir, f"align_t{t}.json"), 'w+', encoding='UTF-8') as f:
                    json.dump(
                        pairaligner_dict,
                        f
                    )
            with open(os.path.join(data_dir, "pairwisealign.done"), "w+", encoding='UTF-8') as asdf:
                pass
        write_status("pairwisealigner.run", data_dir, True)
        print("pairwisealigner end")

    return None


def seq_predict_model(jobid: str, userdir: str, ):
    data_dir = os.path.join(userdir, sha512(
        jobid.encode()).hexdigest())
    prottype = None
    with open(f'{data_dir}/args.json', 'r', encoding='UTF-8') as f:
        args_ = json.load(f)
        prottype = args_['prottype']

    if 'subresult' not in args_:
        args_['subresult'] = {}
    if "0" in prottype:
        for t in ["1","2","3","4","5",
                  "6","7","8","9","10"]:
            if t == "1":
                f = libmodel_addon.T1.load_feature(data_dir=data_dir)
                result = libmodel_addon.T1.runmodel(load_feature=f)
                args_['subresult']["1"] = result.tolist()

            elif t == "2":
                f = libmodel_addon.T2.load_feature(data_dir=data_dir)
                result = libmodel_addon.T2.runmodel(load_feature=f)
                args_['subresult']["2"] = result.tolist()
            
            elif t == "3":
                f = libmodel_addon.T3.load_feature(data_dir=data_dir)
                result = libmodel_addon.T3.runmodel(data_dir=data_dir)
                args_['subresult']["3"] = result.tolist()
                
            elif t == "4":
                f = libmodel_addon.T4.load_feature(data_dir=data_dir)
                result = libmodel_addon.T4.runmodel(data_dir=data_dir)
                args_['subresult']["4"] = result.tolist()
                
            elif t == "5":
                f = libmodel_addon.T5.load_feature(data_dir=data_dir)
                result = libmodel_addon.T5.runmodel(data_dir=data_dir)
                args_['subresult']["5"] = result.tolist()
                
            elif t == "6":
                f = libmodel_addon.T6.load_feature(data_dir=data_dir)
                result = libmodel_addon.T6.runmodel(load_feature=f)
                args_['subresult']["6"] = result.tolist()
            
            elif t == "8":
                result = libmodel_addon.blastp.output(data_dir=data_dir,prottype=t)    
                args_['subresult']["8"] = result.tolist()
            
            elif t == "9":
                result = libmodel_addon.blastp.output(data_dir=data_dir,prottype=t)    
                args_['subresult']["9"] = result.tolist()
    else:
        for t in prottype:
            if t == "1":
                f = libmodel_addon.T1.load_feature(data_dir=data_dir)
                result = libmodel_addon.T1.runmodel(load_feature=f)
                args_['subresult']["1"] = result.tolist()

            elif t == "2":
                f = libmodel_addon.T2.load_feature(data_dir=data_dir)
                result = libmodel_addon.T2.runmodel(load_feature=f)
                args_['subresult']["2"] = result.tolist()
            
            elif t == "3":
                f = libmodel_addon.T3.load_feature(data_dir=data_dir)
                result = libmodel_addon.T3.runmodel(data_dir=data_dir)
                args_['subresult']["3"] = result.tolist()
                
            elif t == "4":
                f = libmodel_addon.T4.load_feature(data_dir=data_dir)
                result = libmodel_addon.T4.runmodel(data_dir=data_dir)
                args_['subresult']["4"] = result.tolist()
                
            elif t == "5":
                f = libmodel_addon.T5.load_feature(data_dir=data_dir)
                result = libmodel_addon.T5.runmodel(data_dir=data_dir)
                args_['subresult']["5"] = result.tolist()
                
            elif t == "6":
                f = libmodel_addon.T6.load_feature(data_dir=data_dir)
                result = libmodel_addon.T6.runmodel(load_feature=f)
                args_['subresult']["6"] = result.tolist()
            
            elif t == "8":
                result = libmodel_addon.blastp.output(data_dir=data_dir,prottype=t)    
                args_['subresult']["8"] = result.tolist()
            
            elif t == "9":
                result = libmodel_addon.blastp.output(data_dir=data_dir,prottype=t)    
                args_['subresult']["9"] = result.tolist()

    with open(f'{data_dir}/args.json', 'w+', encoding='UTF-8') as f:
        json.dump(args_, f)

    return
def seq_blast_model(jobid: str, userdir: str, ):
    data_dir = os.path.join(userdir, sha512(
        jobid.encode()).hexdigest())
    prottype = None
    with open(f'{data_dir}/args.json', 'r', encoding='UTF-8') as f:
        args_ = json.load(f)
        prottype = args_['prottype']

    if 'subresult' not in args_:
        args_['subresult'] = {}
    if "0" in prottype:
        for t in ["1","2","3","4","5",
                  "6","7","8","9","10"]:
            result = libmodel_addon.blastp.output(data_dir=data_dir,prottype=t)    
            args_['subresult'][t] = result.tolist()       
    else:
        for t in prottype:
            result = libmodel_addon.blastp.output(data_dir=data_dir,prottype=t)    
            args_['subresult'][t] = result.tolist()
    
    with open(f'{data_dir}/args.json', 'w+', encoding='UTF-8') as f:
        json.dump(args_, f)

    return

def seq_report_model(jobid: str, userdir: str,):
    data_dir = os.path.join(userdir, sha512(
        jobid.encode()).hexdigest())
    args_ = None
    with open(f'{data_dir}/args.json', 'r', encoding='UTF-8') as f:
        args_ = json.load(f)

    seq_id_list = [s.id for s in SeqIO.parse(f'{data_dir}/seq.fasta', 'fasta')]

    with open(os.path.join(data_dir, 'table.json'), 'w+', encoding='UTF-8') as f:
        json.dump({
            f'T{type_n}': {
                "Voting": {
                    seqid: score
                    for seqid, score in zip(seq_id_list, args_['subresult'][type_n])
                }
            }
            for type_n in args_['prottype']
        }, f)

    writer = pd.ExcelWriter(f"{data_dir}/table.xlsx", engine='openpyxl')

    for type_n in args_['prottype']:
        result_data = list()

        result_data.append(args_['subresult'][f'{type_n}'])
        model_name_ = [
            "Voting",
        ]

        df = pd.DataFrame(
            result_data,
            index=model_name_,
            columns=seq_id_list
        ).T
        df.to_excel(writer, f'T{type_n}')
    writer.save()
    


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, help='config file',)
    parser.add_argument('--m', type=str, help='mode',)
    args = parser.parse_args()
    _args_ = None
    with open(args.config, 'r', encoding='UTF-8') as f:
        _args_ = json.load(f)
    mode = args.m
    if mode == 'txseml':
    # 联机获取特征
        seq_feature_fetcher(
            _args_['jobid'],
            os.environ['USER_DIR']
        )
        write_status("featureweb.done", os.path.join(os.environ['USER_DIR'], sha512(
            _args_['jobid'].encode()).hexdigest()))

        # 本地运行获取特征
        seq_feature_runner(
            _args_['jobid'],
            os.environ['USER_DIR']
        )
        write_status("featurerunner.done", os.path.join(os.environ['USER_DIR'], sha512(
            _args_['jobid'].encode()).hexdigest()))

        # 跑模型
        seq_predict_model(
            _args_['jobid'],
            os.environ['USER_DIR']
        )
        write_status("predicted.done", os.path.join(os.environ['USER_DIR'], sha512(
            _args_['jobid'].encode()).hexdigest()))

        # 获取报告
        seq_report_model(
            _args_['jobid'],
            os.environ['USER_DIR']
        )
        write_status("makereport.done", os.path.join(os.environ['USER_DIR'], sha512(
            _args_['jobid'].encode()).hexdigest()))
    elif mode == 'blast':
        seq_blast_model(
            _args_['jobid'],
            os.environ['USER_DIR']
        )
        write_status("predicted.done", os.path.join(os.environ['USER_DIR'], sha512(
            _args_['jobid'].encode()).hexdigest()))
        
        seq_report_model(
            _args_['jobid'],
            os.environ['USER_DIR']
        )
        write_status("makereport.done", os.path.join(os.environ['USER_DIR'], sha512(
            _args_['jobid'].encode()).hexdigest()))