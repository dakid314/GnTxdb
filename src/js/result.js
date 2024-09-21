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
import { Dialog } from "./component/dialog";
import * as utils from './utils';
document.getElementById("main").querySelector("h1#loadingpage").remove();
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
                    document.location.href = document.baseURI + 'result/index.html'
                })
                throw new Error("Wrong");
            }
            return d.data;
        })
        .then(data => {
            if (data.status == 'pendding') {
                wait_dialog_obj.showinformation(`Your JOB: <code>${data.jobid}</code> is still ${data.status} in the queue ( <code>${data.number}</code> job(s) left).<br><progress style="width: 100%;margin-top: 10px;"></progress><hr><strong>Please click <a href="mailto:?subject=Please Keep TxSEml JobID&body=${document.baseURI + 'result/index.html?jobid=' + data.jobid}">Here</a> to send yourself a mail to keep your JobID. (It will open your mail app)</strong>`, true)
            } else if (data.status == 'running') {
                wait_dialog_obj.showinformation(`Your JOB: <code>${data.jobid}</code> is still ${data.status}.<br><progress style="width: 100%;margin-top: 10px;"></progress><hr><strong>Please click <a href="mailto:?subject=Please Keep TxSEml JobID&body=${document.baseURI + 'result/index.html?jobid=' + data.jobid}">Here</a> to send yourself a mail to keep your JobID. (It will open your mail app)</strong>`, true)
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
                    document.location.href = document.baseURI + 'result/index.html'
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
        window.location.href = document.baseURI + 'result/index.html';
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
        utils.make_DOMnode({
            tagname: "a",
            attr: { href: "blast.html", style: "width:100%;text-align:center" },
            parentnode: search_root,
            innerText: "Back To Predictor Page."
        });
    } else {
        checkjob(html_search_params.jobid).then(s => {
            if (s[0] == 'pendding') {
                wait_dialog_obj.dialog_dom.querySelector('button').addEventListener('click', () => {
                    document.location.href = document.baseURI + 'result/index.html'
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