require("../scss/data.scss");
document.getElementById("main").querySelector("h1#loadingpage").remove();

let homepage_content = document.querySelector("[data_store]#data_page");
document.getElementById("main").innerHTML = homepage_content.innerHTML;
homepage_content.innerHTML = "";

var urlParams = new URLSearchParams(window.location.search);


// var param1 = urlParams.get('param1');

var param1 = urlParams.get('param1')
var param2 = urlParams.get('param2'); 
import { render_table, replaceKeysWithSpaces,render_diff_table } from "./utils"
import * as echarts from "./echarts";
let display_func = () => {
    let table_render_box_dom = document.getElementById("table_render_box");
    table_render_box_dom.removeAttribute("hidden");
    
    table_render_box_dom.removeAttribute("hidden");
    table_render_box_dom.scrollIntoView();
}
let display_diff_func = () => {
    let diff_box_dom = document.getElementById("diff_table_render_box");
    diff_box_dom.removeAttribute("hidden");
    
    diff_box_dom.removeAttribute("hidden");
    diff_box_dom.scrollIntoView();
}
if(param2!='undefined'){
    fetch("assets/data/GnTxSPdb_3.json")
        .then(response => response.json())
        .then(jsonData => {
            var data = {'HMM_Cluster':[],
            'Common_name':[],
            'Num':[],
            };
            var filteredData = jsonData.Protein_Type.map((item, index) => {
                let newItem = {};
                for (let key in jsonData) {
                    if (jsonData.hasOwnProperty(key)) {
                        newItem[key] = jsonData[key][index];
                    }
                }
                return newItem;
            }).filter(item => item.Protein_Type === `T${param2}SP`);
            var a = 1;
            var maxA = 10; // 最大的 a 值

            while (a <= maxA) {
                var cou = 0;
                filteredData.forEach((item) => {
                    if (item.hmm === `HMM_Cluster${a}`) {
                        cou++;
                    }
                });
                data.HMM_Cluster.push(`HMM_Cluster${a}`)
                data.Num.push(cou)
                data.Common_name.push(`T${a}SS`)
                a++;
            }
            let table_filter_layer = document.getElementById("table_filter_layer");
            table_filter_layer.appendChild(
                render_table(replaceKeysWithSpaces(data),"40%")
            );
            display_func();
            var filteredJson = {};
            for (let key in jsonData) {
                if (jsonData.hasOwnProperty(key)) {
                    filteredJson[key] = filteredData.map(item => item[key]);
                }
                }
        var Basic_InforkeysToKeep = [
            'TxSP_ID', 'Protein_Type', 'Confidence', 'Protein_Name',
            'Protein_ID', 'Gene_Name',
            'Function_annotation', 'LocusTag',
            'Gene_ID', 'Genome_Accession',
            'Gene_Coordinates', 'Other_Accession',
            'Protein_Subtype', 'Structure',
            'InterPro_Family', 'TxSP_Family', 'TxSS_Name',
            'TxSS_Subtype', 'Secretion_Signal',
            'Secretion_Chaperone', 'TxSP_Ref'
        ];
        var Bac_InforkeysToKeep = ['TxSP_ID','Bac_Staining','Bac_Phylum','Bac_Class',
            'Bac_Genus','Bac_Species','Bac_Strain','TxSP_Ref'
        ]
        var Seq_InforkeysToKeep = ['TxSP_ID','Prot_Seq','CDS','TxSP_Ref']
        var Transcription_InforkeysToKeep = ['TxSP_ID','Operon','Promoter_Seq','TxSP_Ref']
        var ISLEkeysToKeep = ['TxSP_ID','Intrahost_Subcellular_Localization','ISLE_Evidence','Host','Host_Cell','ISLE_Ref']
        var PPIkeysToKeep = ['TxSP_ID','Protein_Type','Protein_Name','Interactor_Host','Interactor_Name','Interactor_Accession','PPI_Evidence']
        var tmp = {};

        filterKeys(tmp,Basic_InforkeysToKeep)
        let diff_table_filter_layer = document.getElementById("diff_table_filter_layer");
        diff_table_filter_layer.appendChild(
            render_table(replaceKeysWithSpaces(tmp))
        );
        display_diff_func()
        
        let searchButton = document.getElementById("userInput_Basic_Infor");
        if (searchButton) {
            searchButton.addEventListener("click", function() {
                const userInput = document.getElementById('userInput_Basic_Infor').value;
                inpu(userInput);
            });
        }

        let search1Button = document.getElementById("userInput_Bac_Infor");
        if (search1Button) {
            search1Button.addEventListener("click", function() {
                const userInput = document.getElementById('userInput_Bac_Infor').value;
                inpu(userInput);
            });
        }

        let search2Button = document.getElementById("userInput_Seq_Infor");
        if (search2Button) {
            search2Button.addEventListener("click", function() {
                const userInput = document.getElementById('userInput_Seq_Infor').value;
                inpu(userInput);
            });
        }

        let search3Button = document.getElementById("userInput_ISLE");
        if (search3Button) {
            search3Button.addEventListener("click", function() {
                const userInput = document.getElementById('userInput_ISLE').value;
                inpu(userInput);
            });
        }

        let search4Button = document.getElementById("userInput_PPI");
        if (search4Button) {
            search4Button.addEventListener("click", function() {
                const userInput = document.getElementById('userInput_PPI').value;
                inpu(userInput);
            });
        }

        let search5Button = document.getElementById("userInput_Transcription_Infor");
        if (search5Button) {
            search5Button.addEventListener("click", function() {
                const userInput = document.getElementById('userInput_Transcription_Infor').value;
                inpu(userInput);
            });
        }
        
        function filterKeys(data, keysToKeep) {
            for (var key in filteredJson) {
                if (keysToKeep.includes(key)) {
                    data[key] = filteredJson[key];
                }
            }
        }
        function inpu (userInput){
            let diff_table_filter_layer = document.getElementById("diff_table_filter_layer");
            diff_table_filter_layer.innerHTML = '';
            var ntmp = {}
            switch (userInput) {
                case 'Basic_Infor':
                    ntmp = tmp
                case 'Bac_Infor':
                    
                    filterKeys(ntmp, Bac_InforkeysToKeep);
                    break;
                case 'Seq_Infor':
                    
                    filterKeys(ntmp, Seq_InforkeysToKeep);
                    break;
                case 'Transcription_Infor':
                    
                    filterKeys(ntmp, Transcription_InforkeysToKeep);
                    break;
                case 'ISLE':
                    
                    filterKeys(ntmp, ISLEkeysToKeep);
                    break;
                case 'PPI':
                    
                    filterKeys(ntmp, PPIkeysToKeep);
                    break;
            }
            diff_table_filter_layer.appendChild(
                render_table(replaceKeysWithSpaces(ntmp))
            );
            display_diff_func()
        }
        })
}
if(param1!='undefined'){
    fetch("assets/data/GnTxSPdb_3.json")
        .then(response => response.json())
        .then(jsonData => {
            var spaceCount = (param1.split(/\s+/).length - 1);
            var data = {'Prot_type':[],
            'Num':[],
            'System':[],
            'annodation':[],
            };
            var filteredData;
            if (spaceCount === 0) {
                var filteredData = jsonData.Bac_Genus.map((item, index) => {
                    let newItem = {};
                    for (let key in jsonData) {
                        if (jsonData.hasOwnProperty(key)) {
                            newItem[key] = jsonData[key][index];
                        }
                    }
                    return newItem;
                }).filter(item => item.Bac_Genus === param1);}
            
            else if (spaceCount === 1){
                var filteredData = jsonData.Bac_Species.map((item, index) => {
                    let newItem = {};
                    for (let key in jsonData) {
                        if (jsonData.hasOwnProperty(key)) {
                            newItem[key] = jsonData[key][index];
                        }
                    }
                    return newItem;
                }).filter(item => item.Bac_Species === param1);}  
            else {var filteredData = jsonData.Bac_Strain.map((item, index) => {
                let newItem = {};
                for (let key in jsonData) {
                    if (jsonData.hasOwnProperty(key)) {
                        newItem[key] = jsonData[key][index];
                    }
                }
                return newItem;
            }).filter(item => item.Bac_Bac_Strain === param1);} 
            
            var a = 1;
            var maxA = 10; 
            var bingtudata = []
            while (a <= maxA) {
                var cou = 0;
                filteredData.forEach((item) => {
                    if (item.Protein_Type === `T${a}SP`) {
                        cou++;
                    }
                });
                if (cou!=0){
                    bingtudata.push({value: cou, name:`T${a}SP`});}
                data.Prot_type.push(`T${a}SP`)
                data.Num.push(cou)
                data.System.push(`T${a}SS`)
                data.annodation.push('xx')
                a++;
            }
            
            
           
            var table1Data = {
                'Prot_type': data.Prot_type,
                'Num': data.Num,
            };
            
        
            var table2Data = {
                'System': data.System,
                'annodation': data.annodation,
            };

            var myChart = echarts.init(document.getElementById('bingtu_layer'));
            const chartElement = document.getElementById('bingtu_layer');
            chartElement.style.display = 'block';
            var option = {
                title: {
                    text: 'Referer of a Website',
                    subtext: 'Fake Data',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'item'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left'
                },
                series: [
                    {
                    name: 'Access From',
                    type: 'pie',
                    radius: '50%',
                    data:bingtudata,
                    emphasis: {
                        itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                    }
                ]
                };
            
            myChart.setOption(option);
            let table_filter_layer = document.getElementById("table_filter_layer");
            table_filter_layer.style.display = "flex"; // 设置容器为 Flex 容器
            table_filter_layer.style.justifyContent = "space-between"; // 设置子元素在主轴上均匀分布

            // 创建并插入第一个表格
            let table1 = render_table(replaceKeysWithSpaces(table1Data),"40%");
            table_filter_layer.appendChild(table1);

            // 创建并插入第二个表格
            let table2 = render_table(replaceKeysWithSpaces(table2Data),"40%");
            table_filter_layer.appendChild(table2);
            display_func();
            var filteredJson = {};
            for (let key in jsonData) {
                    if (jsonData.hasOwnProperty(key)) {
                        filteredJson[key] = filteredData.map(item => item[key]);
                    }
                    }
            var Basic_InforkeysToKeep = [
                'TxSP_ID', 'Protein_Type', 'Confidence', 'Protein_Name',
                'Protein_ID', 'Gene_Name',
                'Function_annotation', 'LocusTag',
                'Gene_ID', 'Genome_Accession',
                'Gene_Coordinates', 'Other_Accession',
                'Protein_Subtype', 'Structure',
                'InterPro_Family', 'TxSP_Family', 'TxSS_Name',
                'TxSS_Subtype', 'Secretion_Signal',
                'Secretion_Chaperone', 'TxSP_Ref'
            ];
            var Bac_InforkeysToKeep = ['TxSP_ID','Bac_Staining','Bac_Phylum','Bac_Class',
                'Bac_Genus','Bac_Species','Bac_Strain','TxSP_Ref'
            ]
            var Seq_InforkeysToKeep = ['TxSP_ID','Prot_Seq','CDS','TxSP_Ref']
            var Transcription_InforkeysToKeep = ['TxSP_ID','Operon','Promoter_Seq','TxSP_Ref']
            var ISLEkeysToKeep = ['TxSP_ID','Intrahost_Subcellular_Localization','ISLE_Evidence','Host','Host_Cell','ISLE_Ref']
            var PPIkeysToKeep = ['TxSP_ID','Protein_Type','Protein_Name','Interactor_Host','Interactor_Name','Interactor_Accession','PPI_Evidence']
            var tmp = {};
            // for (var key in filteredJson) {
            //     if (Basic_InforkeysToKeep.includes(key)) {
            //         tmp[key] = filteredJson[key];
            //     }
            // }
            filterKeys(tmp,Basic_InforkeysToKeep)
            let diff_table_filter_layer = document.getElementById("diff_table_filter_layer");
            diff_table_filter_layer.appendChild(
                render_table(replaceKeysWithSpaces(tmp))
            );
            display_diff_func()
            
            let searchButton = document.getElementById("userInput_Basic_Infor");
            if (searchButton) {
                searchButton.addEventListener("click", function() {
                    const userInput = document.getElementById('userInput_Basic_Infor').value;
                    inpu(userInput);
                });
            }

            let search1Button = document.getElementById("userInput_Bac_Infor");
            if (search1Button) {
                search1Button.addEventListener("click", function() {
                    const userInput = document.getElementById('userInput_Bac_Infor').value;
                    inpu(userInput);
                });
            }

            let search2Button = document.getElementById("userInput_Seq_Infor");
            if (search2Button) {
                search2Button.addEventListener("click", function() {
                    const userInput = document.getElementById('userInput_Seq_Infor').value;
                    inpu(userInput);
                });
            }

            let search3Button = document.getElementById("userInput_ISLE");
            if (search3Button) {
                search3Button.addEventListener("click", function() {
                    const userInput = document.getElementById('userInput_ISLE').value;
                    inpu(userInput);
                });
            }

            let search4Button = document.getElementById("userInput_PPI");
            if (search4Button) {
                search4Button.addEventListener("click", function() {
                    const userInput = document.getElementById('userInput_PPI').value;
                    inpu(userInput);
                });
            }

            let search5Button = document.getElementById("userInput_Transcription_Infor");
            if (search5Button) {
                search5Button.addEventListener("click", function() {
                    const userInput = document.getElementById('userInput_Transcription_Infor').value;
                    inpu(userInput);
                });
            }
            
            function filterKeys(data, keysToKeep) {
                for (var key in filteredJson) {
                    if (keysToKeep.includes(key)) {
                        data[key] = filteredJson[key];
                    }
                }
            }
            function inpu (userInput){
                let diff_table_filter_layer = document.getElementById("diff_table_filter_layer");
                diff_table_filter_layer.innerHTML = '';
                var ntmp = {}
                switch (userInput) {
                    case 'Basic_Infor':
                        ntmp = tmp
                    case 'Bac_Infor':
                        
                        filterKeys(ntmp, Bac_InforkeysToKeep);
                        break;
                    case 'Seq_Infor':
                        
                        filterKeys(ntmp, Seq_InforkeysToKeep);
                        break;
                    case 'Transcription_Infor':
                        
                        filterKeys(ntmp, Transcription_InforkeysToKeep);
                        break;
                    case 'ISLE':
                        
                        filterKeys(ntmp, ISLEkeysToKeep);
                        break;
                    case 'PPI':
                        
                        filterKeys(ntmp, PPIkeysToKeep);
                        break;
                }
                diff_table_filter_layer.appendChild(
                    render_table(replaceKeysWithSpaces(ntmp))
                );
                display_diff_func()
            }
            
            
})}