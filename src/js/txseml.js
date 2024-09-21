/*
 * @Author: George Zhao
 * @Date: 2022-07-19 22:48:37
 * @LastEditors: George Zhao
 * @LastEditTime: 2022-11-04 22:54:11
 * @Description:
 * @Email: 2018221138@email.szu.edu.cn
 * @Company: SZU
 * @Version: 1.0
 */
require("../scss/blast.scss");
import * as utils from "./utils";
import { Dialog } from "./component/dialog";

const MAX_SEQ_NUM = 6000;

function check_fasta(seq_string) {
    const aa_char_set = 'ACDEFGHIKLMNPQRSTVWY';

    // Format Check
    let seq_list = [];
    let line_list = seq_string.split("\n");
    for (let index = 0; index < line_list.length; index++) {
        let line = line_list[index];
        let matched_group = line.match(/^>(\S+)\s?([\S\s]+)?[\r\n]{0,2}$/);
        if (matched_group != undefined) {
            seq_list.push({
                name: matched_group[1],
                desc: matched_group[2],
                seq_string: ''
            })
        } else {
            if (line.match(/^\s*$/) != undefined)
                continue
            if (seq_list.length <= 0)
                return {
                    result: 'wrong',
                    reason: {
                        text: 'format',
                        position: { lineindex: index + 1, cindex: 1 },
                    },
                    data: undefined
                }

            for (let cindex = 0; cindex < line.length; cindex++) {
                let character = line[cindex];
                if (aa_char_set.indexOf(character) != -1) {
                    seq_list[seq_list.length - 1].seq_string += character
                    continue
                } else if (character.match(/\s+/) != undefined) {
                    continue
                } else {
                    return {
                        result: 'wrong',
                        reason: {
                            text: 'unknow-char',
                            position: { lineindex: index + 1, cindex: cindex + 1 },
                        },
                        data: undefined
                    }
                }
            }
        }
    }
    // Check Number
    if (seq_list.length > MAX_SEQ_NUM)
        return {
            result: 'wrong',
            reason: {
                text: 'seq_num',
                num: seq_list.length,
                supposed: MAX_SEQ_NUM
            },
            data: undefined
        }
    for (let seqindex = 0; seqindex < seq_list.length; seqindex++) {
        if (seq_list[seqindex].seq_string.length < 10) {
            return {
                result: 'wrong',
                reason: {
                    text: 'seq_length',
                    seqindex: seqindex + 1,
                    length: seq_list[seqindex].seq_string.length,
                    supposed: 10
                },
                data: undefined
            }
        }
    }
    return {
        result: 'ok',
        reason: undefined,
        data: seq_list
    }
}
document.getElementById("main").querySelector("h1#loadingpage").remove();
function build_predictor_dom(parentnode = document.getElementById("main")) {
    let wait_dialog_obj = new Dialog({
        parentnode: document.body,
    })
    // window.wait_dialog_obj = wait_dialog_obj;

    let predictor_root = utils.make_DOMnode({
        tagname: "div",
        attr: { id: "predictor_root" },
        parentnode: parentnode
    });
    let predictor_form_header = utils.make_DOMnode({
        tagname: "div",
        attr: { id: "predictor_form_header" },
        parentnode: predictor_root
    });
    let predictor_form_header_text = utils.make_DOMnode({
        tagname: "h1",
        attr: { id: "predictor_form_header_text" },
        parentnode: predictor_form_header,
        innerText: "Blastp"
    });
    let predictor_form_root = utils.make_DOMnode({
        tagname: "div",
        attr: { id: "predictor_form_root" },
        parentnode: predictor_root
    });

    let UUID_display_box = utils.make_DOMnode({
        tagname: "div",
        attr: { form_div: "form_uuid" },
        parentnode: predictor_form_root,
    });
    let UUID_label = utils.make_DOMnode({
        tagname: "label",
        attr: {},
        parentnode: UUID_display_box,
        innerHTML: "JobID: <a href='result'>Find Your Submited Job</a>",
    });
    let UUID_box = utils.make_DOMnode({
        tagname: "input",
        attr: { type: "text", value: utils.createUUID(), readonly: "" },
        parentnode: UUID_display_box,
    });
    // UUID_box.style.width = UUID_box.value.length + "em";

    let prot_type_display_box = utils.make_DOMnode({
        tagname: "div",
        attr: { form_div: "form_prottype" },
        parentnode: predictor_form_root,
    });
    let prot_type_label = utils.make_DOMnode({
        tagname: "label",
        attr: {},
        parentnode: prot_type_display_box,
        innerText: "Prot Type: ",
    });
    let prot_type_box = utils.make_DOMnode({
        tagname: "div",
        attr: { id: "prot_type_box" },
        parentnode: prot_type_display_box,
    });

    [1, 2, 3, 4, 5,6, 8, 9,10, 0].forEach((type_n) => {
        let prot_type_item_box = utils.make_DOMnode({
            tagname: "div",
            attr: { class: "prottype_container" },
            parentnode: prot_type_box,
        });
        let label = utils.make_DOMnode({
            tagname: "label",
            attr: {},
            parentnode: prot_type_item_box,
        });
        if (type_n !== 0) {
            label.innerText = `T${type_n}SE: `;
        } else {
            label.innerText = "ALL: ";
        }
        utils.make_DOMnode({
            tagname: "input",
            attr: { id: `prot_type${type_n}`, type: "checkbox" },
            parentnode: prot_type_item_box,
        });
    });

    let fasta_text_display_box = utils.make_DOMnode({
        tagname: "div",
        attr: { form_div: "form_fasta_text_display_box" },
        parentnode: predictor_form_root,
    });
    let fasta_text_box = utils.make_DOMnode({
        tagname: "textarea",
        attr: { form_div: "fasta_text_box", placeholder: " Input fasta data here, or Choose a file." },
        parentnode: fasta_text_display_box,
    });

    let fasta_upload_display_box = utils.make_DOMnode({
        tagname: "div",
        attr: { form_div: "form_fasta" },
        parentnode: predictor_form_root,
    });
    let file_upload_label = utils.make_DOMnode({
        tagname: "label",
        attr: {},
        parentnode: fasta_upload_display_box,
        innerText: "Fasta: ",
    });
    let file_upload_box = utils.make_DOMnode({
        tagname: "input",
        attr: { type: "file", },
        parentnode: fasta_upload_display_box,
    });
    let _to_check_fasta = async (e) => {
        wait_dialog_obj.dialog_dom.innerHTML = `<h1>WAIT TO CHECK YOUR FILE...</h1>`;
        wait_dialog_obj.open();
        let result = undefined;
        if (e.type == 'change')
            result = check_fasta(await file_upload_box.files[0].text());
        else {
            file_upload_box.value = '';
            file_upload_box.seq_list = undefined;
            result = check_fasta(fasta_text_box.value);
        }

        if (result.result == 'wrong') {
            file_upload_box.value = '';
            file_upload_box.seq_list = undefined;
            if (result.reason.text == 'seq_num') {
                wait_dialog_obj.dialog_dom.innerHTML = `<div>Found ${result.reason.num} seq in the File<br>Do not submit more than ${result.reason.supposed} seq<hr><button>Close</button></div>`;
                wait_dialog_obj.dialog_dom.querySelector('button').onclick = () => { wait_dialog_obj.close(); }
                return;
            } else if (result.reason.text == 'unknow-char' | result.reason.text == 'format') {
                wait_dialog_obj.dialog_dom.innerHTML = `<div>Found Wrong Format or Wrong character in ${result.reason.position.lineindex} line and ${result.reason.position.cindex} column in the file or your input.<hr><button>Close</button></div>`;
                wait_dialog_obj.dialog_dom.querySelector('button').onclick = () => { wait_dialog_obj.close(); }
                return;
            } else if (result.reason.text == 'seq_length' | result.reason.text == 'format') {
                wait_dialog_obj.showinformation(`Sequence Length ( ${result.reason.length} ) should be longer than ${result.reason.supposed} in the ${result.reason.seqindex}th one.`, true)
                return;
            } {
                wait_dialog_obj.dialog_dom.innerHTML = `<div>Found UNkNOW Wrong: ${result.reason.text}<hr><button>Close</button></div>`;
                wait_dialog_obj.dialog_dom.querySelector('button').onclick = () => { wait_dialog_obj.close(); }
                return;
            }
        }
        wait_dialog_obj.dialog_dom.innerHTML = `<div>Found ${result.data.length} seq in your file<hr><button>Close</button></div>`;
        wait_dialog_obj.dialog_dom.querySelector('button').onclick = () => { wait_dialog_obj.close(); }
        file_upload_box.seq_list = result.data;
    }
    fasta_text_box.addEventListener('blur', _to_check_fasta)
    file_upload_box.addEventListener('click', (e) => {
        fasta_text_box.value = '';
        file_upload_box.value = '';
        file_upload_box.seq_list = undefined;
    })
    file_upload_box.addEventListener('change', _to_check_fasta)
    let email_display_box = utils.make_DOMnode({
        tagname: "div",
        attr: { form_div: "form_email" },
        parentnode: predictor_form_root,
    });
    let email_label = utils.make_DOMnode({
        tagname: "label",
        attr: {},
        parentnode: email_display_box,
        innerText: "Email: ",
    });
    let email_box = utils.make_DOMnode({
        tagname: "input",
        attr: { type: "email", },
        parentnode: email_display_box,
    });
    let submit_button_display_box = utils.make_DOMnode({
        tagname: "div",
        attr: { form_div: "form_submit_button" },
        parentnode: predictor_form_root,
    });
    let submit_button = utils.make_DOMnode({
        tagname: "button",
        attr: { id: "submit_button" },
        parentnode: submit_button_display_box,
        innerText: "Submit"
    });

    let help_button = utils.make_DOMnode({
        tagname: "button",
        attr: { id: "help_button" },
        parentnode: submit_button_display_box,
        innerText: "Help"
    });
    // let usage_display_box = utils.make_DOMnode({
    //     tagname: "div",
    //     attr: { form_div: "form_usage" },
    //     parentnode: predictor_form_root,
    // });
    // let usage_label = utils.make_DOMnode({
    //     tagname: "label",
    //     attr: {},
    //     parentnode: usage_display_box,
    //     innerText: "Usage: ",
    // });
    // let usage_box = utils.make_DOMnode({
    //     tagname: "input",
    //     attr: { type: "text", },
    //     parentnode: usage_display_box,
    // });
    help_button.addEventListener('click', async () => {
        window.location.href = 'help.html';
    });
    submit_button.addEventListener('click', async () => {
        wait_dialog_obj.dialog_dom.innerHTML = '<h1>WAIT a MOMENT...</h1>';
        wait_dialog_obj.open();

        let args_dict = {
            'jobid': UUID_box.value,
            'fasta_data': file_upload_box.seq_list,
            'prottype': Array.from(document.querySelectorAll(".prottype_container")).filter((r) => {
                return r.querySelector('input').checked
            }).map(r => {
                return r.querySelector('input').id.match(/prot_type(\d+)/)[1]
            }),
            'email': document.querySelector("div[form_div=form_email]>input[type=email]").value
        }
        if (args_dict.prottype.length == 0) {
            args_dict.prottype = undefined
            wait_dialog_obj.showinformation("<strong>Please Select Prot type.</strong>", true)
            throw new Error("Please Select Prot type.")
        }
        if (args_dict.fasta_data == undefined) {
            wait_dialog_obj.showinformation("<strong>Please Select Fasta File.</strong>", true)
            throw new Error("Please Select Fasta File.")
        }
        if (args_dict.email == undefined & args_dict.email.match(/^[0-9a-zA-Z][-0-9a-zA-Z]*@[0-9a-zA-Z][-0-9a-zA-Z]*(\.[-0-9a-zA-Z]+)+$/
        ) != undefined) {
            wait_dialog_obj.showinformation("<strong>Please Input Correctly formatted email address.</strong>", true)
            throw new Error("Please Input email.")
        }

        let promise_ = fetch(document.baseURI + 'api/job_submit', {
            method: 'post', body: JSON.stringify(args_dict)
        })
            .then(r => r.json()).then(d => {
                if (d.code != 0) {
                    wait_dialog_obj.showinformation(`<strong><pre>${d.msg}</pre></strong><details><sumary><pre>${d.errdetail}</pre></sumary></details>`, true)
                    UUID_box.value = utils.createUUID();
                    throw new Error("Wrong");
                }
                return d.data
            }).then(data => {
                if (window.localStorage.UUID_list == undefined)
                    window.localStorage.UUID_list = '[]';
                let UUID_list = JSON.parse(window.localStorage.UUID_list)
                UUID_list.push(data.jobid)

                window.localStorage.UUID_list = JSON.stringify(UUID_list);

                window.location.href = document.baseURI + `result?jobid=${data.jobid}`;
                return data;
            }).catch(() => { });
    })
}
build_predictor_dom()
/*
 * @Author: George Zhao
 * @Date: 2022-07-20 00:33:40
 * @LastEditors: George Zhao
 * @LastEditTime: 2022-10-23 22:51:57
 * @Description: 
 * @Email: 2018221138@email.szu.edu.cn
 * @Company: SZU
 * @Version: 1.0
 */
require("../scss/result.scss");


let html_search_params = utils.html_search_params();
let wait_dialog_obj = new Dialog({
    parentnode: document.body,
})

const checkjob = (_tosearch_id) => {
    return fetch(document.baseURI + `api/job_status?jobid=${_tosearch_id}`)
        .then(r => r.json())
        .then(d => {
            wait_dialog_obj.showinformation(`<h1>WAIT a MOMENT...</h1>`, false)
            if (d.code != 0) {
                wait_dialog_obj.showinformation(`Error: <code>${d.code}</code>;. Server return msg: <pre>${d.msg}</pre>`, true)
                wait_dialog_obj.dialog_dom.querySelector('button').addEventListener('click', () => {
                    document.location.href = document.baseURI + 'result'
                })
                throw new Error("Wrong");
            }
            return d.data;
        })
        .then(data => {
            if (data.status == 'pendding') {
                wait_dialog_obj.showinformation(`Your JOB: <code>${data.jobid}</code> is still ${data.status} in the queue ( <code>${data.number}</code> job(s) left).<br><progress style="width: 100%;margin-top: 10px;"></progress><hr><strong>Please click <a href="mailto:?subject=Please Keep TxSEml JobID&body=${document.baseURI + 'result?jobid=' + data.jobid}">Here</a> to send yourself a mail to keep your JobID. (It will open your mail app)</strong>`, true)
            } else if (data.status == 'running') {
                wait_dialog_obj.showinformation(`Your JOB: <code>${data.jobid}</code> is still ${data.status}.<br><progress style="width: 100%;margin-top: 10px;"></progress><hr><strong>Please click <a href="mailto:?subject=Please Keep TxSEml JobID&body=${document.baseURI + 'result?jobid=' + data.jobid}">Here</a> to send yourself a mail to keep your JobID. (It will open your mail app)</strong>`, true)
            } else {
                wait_dialog_obj.close();
            }
            return [data.status, data.jobid, data];
        })
}
const render_result = (jobid) => {
    return fetch(document.baseURI + `api/getResult?jobid=${jobid}`).then(r => r.json())
        .then(d => {
            wait_dialog_obj.showinformation(`<h1>WAIT a MOMENT...</h1>`, false)
            if (d.code != 0) {
                wait_dialog_obj.showerror(d.code, d.msg, d.errdetail);
                wait_dialog_obj.dialog_dom.querySelector('button').addEventListener('click', () => {
                    document.location.href = document.baseURI + 'result'
                })
                throw new Error("Wrong");
            }
            wait_dialog_obj.close()
            return d.data;
        })
        .then((data) => {
            let _prot_type = Object.keys(data.file_list.tablejson)
            let model_type = Object.keys(data.file_list.tablejson[_prot_type[0]])
            let seq_id_list = Object.keys(data.file_list.tablejson[_prot_type[0]][model_type[0]])

            let result_render_dom = utils.make_DOMnode(
                {
                    tagname: 'div', attr: { id: 'result_render_dom' }, parentnode: document.querySelector('#main')
                }
            )
            let result_render_box = utils.make_DOMnode(
                {
                    tagname: 'div', attr: { id: 'result_render_box' }, parentnode: result_render_dom
                }
            )
            utils.make_DOMnode(
                {
                    tagname: 'h1',
                    attr: { style: 'margin-left: 10px;margin-right: 10px;text-align: center' },
                    innerText: 'RESULT TABLE',
                    parentnode: result_render_box
                }
            )
            _prot_type.forEach(type_n => {
                let formdata = {}
                formdata['seqid'] = seq_id_list
                Object.keys(data.file_list.tablejson[type_n]).forEach((modeltype) => {
                    formdata[modeltype] = seq_id_list.map(sid => { return parseFloat(data.file_list.tablejson[type_n][modeltype][sid]).toFixed(3); });
                })
                let details_dom = utils.make_DOMnode(
                    {
                        tagname: 'details', attr: { id: `details_${type_n}`, class: "result_table_details" }, parentnode: result_render_box
                    }
                )
                utils.make_DOMnode(
                    {
                        tagname: 'summary', attr: {}, innerHTML: `<strong>${type_n}</strong>`, parentnode: details_dom
                    }
                )
                utils.make_DOMnode(
                    {
                        tagname: 'div', attr: { id: 'table_render_dom' }, innerNode: utils.render_table(
                            formdata, `${type_n}`
                        ), parentnode: details_dom
                    }
                )
            })
            let tabledownload_render_dom = utils.make_DOMnode(
                {
                    tagname: 'div',
                    attr: { id: 'tabledownload_render_dom' },
                    parentnode: result_render_box
                }
            )
            utils.make_DOMnode(
                {
                    innerText: "Download *.xlsx table.",
                    tagname: 'a', attr: {
                        id: 'a', download: 'result.xlsx',
                        href: URL.createObjectURL(utils.b64toBlob(data.file_list.tablexlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    }, parentnode: tabledownload_render_dom
                }
            )
        })
}

const render_running = (jobid, data) => {

    let running_render_dom = utils.make_DOMnode(
        {
            tagname: 'div', attr: { id: 'running_render_dom' }, parentnode: document.querySelector('#main'),
            innerHTML: "<h4 id='networkwaiting_obj' style='text-align: center;'>Getting Network status, Waiting...</h4>"
        }
    )
    fetch('api/getNetworkstate').then(
        r => r.json()
    ).then(d => {
        d = d.data.status;
        running_render_dom.querySelector('#networkwaiting_obj').remove();
        let webserver_renderdiv_dom = utils.make_DOMnode(
            {
                tagname: 'div', attr: { id: 'progress_renderdiv_dom' }, parentnode: running_render_dom,
            }
        )
        utils.make_DOMnode(
            {
                tagname: 'caption', attr: { id: 'webserver_title_dom', style: 'caption-side: unset;width: max-content;' }, parentnode: webserver_renderdiv_dom,
                innerText: 'Depended Service Status'
            }
        )
        let webserver_render_dom = utils.make_DOMnode(
            {
                tagname: 'tbody', attr: { id: 'webserver_render_dom' }, parentnode: webserver_renderdiv_dom,
            }
        )
        Object.keys(d).forEach(element => {

            let status_color = undefined;
            let status_text = undefined;
            if (d[element].status != 200) {
                status_color = 'red';
                status_text = `<a style="color:red" href="${d[element].url}">Striking</a>`;
            }
            else {
                status_color = 'green';
                status_text = 'Available';
            }

            let htmlcontent = `<td style='padding-right:5px'>${element}: </td><td style='color:${status_color}'>${status_text}</td>`;
            utils.make_DOMnode(
                {
                    tagname: 'tr', attr: { class: 'webserver_container_dom' }, parentnode: webserver_render_dom,
                    innerHTML: htmlcontent
                }
            )
        });
    })

    let status_dict = {};
    let origin_status_dict = {};
    data.file.forEach(filename => {
        let filename_tuple = filename.split('.')
        origin_status_dict[filename_tuple[0]] = filename_tuple[1];
    })
    // Progressing

    status_dict['submit'] = { text: 'Sequence Submit', status: 'complete' }
    if (origin_status_dict.featureweb == 'done' & origin_status_dict.featurerunner == 'done')
        status_dict['feature'] = { text: 'Feature Fetch', status: 'complete' }
    else
        status_dict['feature'] = { text: 'Feature Fetch', status: 'waiting' }
    if (origin_status_dict.predicted == 'done')
        status_dict['predict'] = { text: 'Model Predict', status: 'complete' }
    else
        status_dict['predict'] = { text: 'Model Predict', status: 'waiting' }
    if (origin_status_dict.makereport == 'done')
        status_dict['makereport'] = { text: 'Make Report', status: 'complete' }
    else
        status_dict['makereport'] = { text: 'Make Report', status: 'waiting' }

    console.log(status_dict);

    let progress_colcontainer_dom = utils.make_DOMnode(
        {
            tagname: 'div', attr: { id: 'progress_colcontainer_dom' }, parentnode: running_render_dom,
        }
    )
    let progress_renderdiv_dom = utils.make_DOMnode(
        {
            tagname: 'div', attr: { id: 'progress_renderdiv_dom' }, parentnode: progress_colcontainer_dom,
        }
    )
    utils.make_DOMnode(
        {
            tagname: 'caption', attr: { id: 'webserver_title_dom', style: 'caption-side: unset;width: max-content;' }, parentnode: progress_renderdiv_dom,
            innerText: 'Job Progress'
        }
    )
    let progress_render_dom = utils.make_DOMnode(
        {
            tagname: 'tbody', attr: { id: 'progress_render_dom' }, parentnode: progress_renderdiv_dom,
        }
    )
    Object.keys(status_dict).forEach((key, index) => {

        let status_color = undefined;
        let status_text = undefined;
        if (status_dict[key].status == 'waiting' & status_dict[Object.keys(status_dict)[index]] == 'complete') {
            status_color = 'orange';
            status_text = 'Running';
        }
        else if (status_dict[key].status == 'complete') {
            status_color = 'green';
            status_text = 'Ready';
        } else {
            status_color = '';
            status_text = '';
        }

        let htmlcontent = `<td style='padding-right:5px'>${key}: </td><td style='color:${status_color}'>${status_text}</td>`;
        utils.make_DOMnode(
            {
                tagname: 'tr', attr: { class: 'status_container_dom' }, parentnode: progress_render_dom,
                innerHTML: htmlcontent
            }
        )
    });

    utils.make_DOMnode(
        {
            tagname: 'progress', attr: {
                id: 'progress_bar_',
                style: 'width:100%',
                min: 0,
                max: 4,
                value: Object.keys(status_dict).filter(k => { return status_dict[k]['status'] == 'complete' }).length
            }, parentnode: progress_renderdiv_dom,
        }
    )

    let running_task_render_dom = utils.make_DOMnode(
        {
            tagname: 'div', attr: {
                id: 'running_task_render_dom',
            }, parentnode: progress_colcontainer_dom,
        }
    )
    utils.make_DOMnode(
        {
            tagname: 'label', attr: {
                id: 'running_task_label',
                style: "margin-right: 5px;"
            }, parentnode: running_task_render_dom,
            innerText: 'Running Step: '
        }
    )
    let running_task_container = utils.make_DOMnode(
        {
            tagname: 'div', attr: {
                id: 'running_task_container',
                style: 'display: inline;'
            }, parentnode: running_task_render_dom,
        }
    )

    Object.keys(origin_status_dict).forEach(k => {
        if (origin_status_dict[k] == 'run') {
            utils.make_DOMnode(
                {
                    tagname: 'span', attr: {
                        style: "display: inline-block;margin-right': '5px",
                        id: 'running_task_container',
                    }, parentnode: running_task_container,
                    innerText: k
                }
            )
        }
    })

    if (running_task_container.innerText == '')
        utils.make_DOMnode(
            {
                tagname: 'span', attr: {
                    style: "text-align: right;display: inline-block;margin-right': '5px",
                    id: 'running_task_container',
                }, parentnode: running_task_container,
                innerText: 'None'
            }
        )



}

async function main() {

    if (html_search_params.clean_history != undefined) {
        window.localStorage.UUID_list = '[]';
        window.location.href = document.baseURI + 'result';
    } else if (html_search_params.jobid == undefined | html_search_params.jobid == '') {

        let search_root = utils.make_DOMnode({
            tagname: "div",
            attr: { id: "search_root" },
            parentnode: document.getElementById("main"),
        });
        let search_header = utils.make_DOMnode({
            tagname: "h1",
            attr: { id: "search_header" },
            parentnode: search_root,
            innerText: 'Job Querier'
        });
        utils.make_DOMnode({
            tagname: "br",
            attr: {},
            parentnode: search_root,
        });
        let search_display_box = utils.make_DOMnode({
            tagname: "div",
            attr: { form_div: "form_search" },
            parentnode: search_root
        });
        let datalist_dom = utils.make_DOMnode({
            tagname: "datalist",
            attr: { id: 'jobid_datalist' },
            parentnode: search_display_box,
        });
        if (window.localStorage.UUID_list == undefined) {
            window.localStorage.UUID_list = '[]';
        }
        JSON.parse(window.localStorage.UUID_list).reverse().forEach((jobid) => {
            utils.make_DOMnode({
                tagname: "option",
                attr: { value: jobid },
                parentnode: datalist_dom,
            });
        });
        let search_label = utils.make_DOMnode({
            tagname: "label",
            attr: {},
            parentnode: search_display_box,
            innerHTML: "Job ID: ",
        });
        utils.make_DOMnode({
            tagname: "span",
            attr: { style: 'margin-right: 10px' },
            parentnode: search_display_box,
        });
        let search_box = utils.make_DOMnode({
            tagname: "input",
            attr: { type: "jobid", list: 'jobid_datalist' },
            parentnode: search_display_box,
        });
        utils.make_DOMnode({
            tagname: "span",
            attr: { style: 'margin-right: 10px' },
            parentnode: search_display_box,
        });
        let search_button = utils.make_DOMnode({
            tagname: "button",
            attr: { style: 'border: none;padding-left: 10px;padding-right: 10px' },
            parentnode: search_display_box,
            innerText: "SEARCH"
        });
        search_button.addEventListener('click', (e) => {
            document.location.href = document.baseURI + `result/index.html?jobid=${search_box.value}`;
            // check and see the box
            // checkjob(search_box.value).then(s => {
            //     if (s[0] == 'ok') {
            //         document.location.href = document.baseURI + `result?jobid=${s[1]}`;
            //     }
            // });
        });
        utils.make_DOMnode({
            tagname: "br",
            attr: {},
            parentnode: search_root,
        });
        
    } else {
        checkjob(html_search_params.jobid).then(s => {
            if (s[0] == 'pendding') {
                wait_dialog_obj.dialog_dom.querySelector('button').addEventListener('click', () => {
                    document.location.href = document.baseURI + 'result'
                })
                // throw new Error("Wrong")
                return;
            } else if (s[0] == 'complete') {
                wait_dialog_obj.showforatime("Success", 2.0);
                render_result(s[1]);
                return;
            } else {
                // Running
                render_running(s[1], s[2]);
            }
        })
    }
}
main()