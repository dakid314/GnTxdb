/*
 * @Author: George Zhao
 * @Date: 2022-07-20 00:36:32
 * @LastEditors: George Zhao
 * @LastEditTime: 2022-07-23 13:35:35
 * @Description: 
 * @Email: 2018221138@email.szu.edu.cn
 * @Company: SZU
 * @Version: 1.0
 */

function addbookmark(title, url) {
    if (window.sidebar) {
        // Firefox
        window.sidebar.addPanel(title, url, '');
    }
    else if (window.opera && window.print) {
        // Opera
        var elem = document.createElement('a');
        elem.setAttribute('href', url);
        elem.setAttribute('title', title);
        elem.setAttribute('rel', 'sidebar');
        elem.click(); //this.title=document.title;
    }
    else if (document.all) {
        // ie
        window.external.AddFavorite(url, title);
    }
}

function make_DOMnode({ tagname: tagname, attr: attr, parentnode: parentnode, innerHTML: innerHTML, innerText: innerText, innerNode: innerNode }) {
    let node = document.createElement(tagname);
    if (attr != undefined)
        Object.keys(attr).forEach(k => node.setAttribute(k, attr[k]));
    if (parentnode != undefined)
        parentnode.appendChild(node);
    if (innerNode != undefined)
        node.appendChild(innerNode);
    if (innerHTML != undefined)
        node.innerHTML = innerHTML;
    if (innerText != undefined)
        node.innerText = innerText;
    return node;
}

const html_search_params = () => {
    return new Proxy(
        new URLSearchParams(window.location.search),
        {
            get: (searchParams, prop) => searchParams.get(prop),
        }
    )
};

function createUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}

function render_table(data, width,caption = undefined, table_head = undefined) {
    let table_dom = document.createElement("table");
    table_dom.style.width = width;
    table_dom.style.margin = "auto";
    
    let head_keys = Object.keys(data);
    // check length
    let data_length = data[head_keys[0]].length;

    head_keys.forEach((e) => {
        if (data[e].length != data_length)
            throw Error(`${e}: data[e].length != data_length`);
    });
    if (caption != undefined) {
        let caption_dom = document.createElement("caption");
        caption_dom.innerHTML = caption;
        table_dom.appendChild(caption_dom);
    }
    // Add Head.
    let head_dom = document.createElement("thead");
    let head_row_dom = document.createElement("tr");
    head_dom.appendChild(head_row_dom);
    table_dom.appendChild(head_dom);

    if (table_head == undefined) {
        head_keys.forEach((e) => {
            let cell_dom = document.createElement("th");
            cell_dom.innerText = e;
            head_row_dom.appendChild(cell_dom);
        });
    } else {
        head_keys.forEach((e) => {
            let cell_dom = document.createElement("th");
            cell_dom.innerText = table_head[e];
            head_row_dom.appendChild(cell_dom);
        });
    }

    // Add Cell
    let tbody_dom = document.createElement("tbody");
    [...Array(data_length).keys()].forEach((_, i) => {
        let row_dom = document.createElement("tr");

        head_keys.forEach((key) => {
            let cell_dom = document.createElement("td");
            cell_dom.innerText = data[key][i];
            cell_dom.classList.add(`tdcell_${key}`);
            row_dom.appendChild(cell_dom);
        });

        tbody_dom.appendChild(row_dom);
    });
    table_dom.appendChild(tbody_dom);
    return table_dom;
}
const b64toBlob = (b64Data, contentType, sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

function replaceKeysWithSpaces(obj, replacement = "_") {
    var newObj = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (key.includes(" ")) {
                var newKey = key.replace(/ /g, replacement);
                if (newObj.hasOwnProperty(newKey)) {
                    throw new Error("Found replaced key:" + newKey);
                } else {
                    newObj[newKey] = obj[key];
                }
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    return newObj;
}
function render_diff_table(data, width, sheets, caption = undefined, table_head = undefined) {
    let table_dom = document.createElement("table");
    table_dom.style.width = width;
    table_dom.style.margin = "auto";

    // Validate data consistency
    let head_keys = Object.keys(data);
    let data_length = data[head_keys[0]].length;
    head_keys.forEach((e) => {
        if (data[e].length !== data_length) {
            throw new Error(`${e}: data[e].length != data_length`);
        }
    });

    // Caption
    if (caption !== undefined) {
        let caption_dom = document.createElement("caption");
        caption_dom.innerHTML = caption;
        table_dom.appendChild(caption_dom);
    }

    // Table Head
    let head_dom = document.createElement("thead");
    let head_row_dom = document.createElement("tr");
    head_keys.forEach((e) => {
        let cell_dom = document.createElement("th");
        cell_dom.innerText = table_head ? table_head[e] : e;
        head_row_dom.appendChild(cell_dom);
    });
    head_dom.appendChild(head_row_dom);
    table_dom.appendChild(head_dom);

    // Table Body
    let tbody_dom = document.createElement("tbody");
    [...Array(data_length).keys()].forEach((_, i) => {
        let row_dom = document.createElement("tr");
        head_keys.forEach((key) => {
            let cell_dom = document.createElement("td");
            cell_dom.innerText = data[key][i];
            cell_dom.classList.add(`tdcell_${key}`);
            row_dom.appendChild(cell_dom);
        });
        tbody_dom.appendChild(row_dom);
    });
    table_dom.appendChild(tbody_dom);

    // Table Foot (Buttons)
    let tfoot_dom = document.createElement("tfoot");
    let tfoot_row = document.createElement("tr");
    sheets.forEach((sheet) => {
        let button_cell = document.createElement("td");
        let button = document.createElement("button");
        button.innerText = sheet.name;
        button.addEventListener("click", () => {
            // Clear existing tbody content
            while (tbody_dom.firstChild) {
                tbody_dom.removeChild(tbody_dom.firstChild);
            }
            // Update tbody with new data
            Object.keys(sheet.data).forEach((key) => {
                sheet.data[key].forEach((value, i) => {
                    let row_dom = document.createElement("tr");
                    let cell_dom = document.createElement("td");
                    cell_dom.innerText = value;
                    cell_dom.classList.add(`tdcell_${key}`);
                    row_dom.appendChild(cell_dom);
                    tbody_dom.appendChild(row_dom);
                });
            });
        });
        button_cell.appendChild(button);
        tfoot_row.appendChild(button_cell);
    });
    tfoot_dom.appendChild(tfoot_row);
    table_dom.appendChild(tfoot_dom);

    return table_dom;
}


export { make_DOMnode, html_search_params, createUUID, render_table, b64toBlob, replaceKeysWithSpaces,render_diff_table };