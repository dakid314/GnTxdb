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
        let first_promise_ = fetch(document.baseURI + 'api/job_blast_submit', {
            method: 'post', body: JSON.stringify(args_dict)
        })
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

