require("../scss/GnTxSPdb.scss");
import * as echarts from "./echarts";
document.getElementById("main").querySelector("h1#loadingpage").remove();

let homepage_content = document.querySelector("[data_store]#GnTxSPdb_page");
document.getElementById("main").innerHTML = homepage_content.innerHTML;
homepage_content.innerHTML = "";

const proteinElements = document.querySelectorAll('.protein-icon');

// 遍历每个元素
proteinElements.forEach(element => {
  // 添加点击事件监听器
  element.addEventListener('click', function() {
    // 从当前元素的 id 中提取数字
    var prot = element.id.match((/\d+/));
    var url = 'data.html?param1='+encodeURIComponent() + '&param2=' + encodeURIComponent(prot);
    window.open(url, '_blank'); // 在新窗口中打开页面
  });
});



let searchButton = document.getElementById("search");

searchButton.addEventListener("click", function(){
    const userInput = document.getElementById('userInput').value;
    fetch("assets/data/GnTxSPdb_3.json")
        .then(response => response.json())
        .then(jsonData => {
            let Species =  [];
            let strainl = {};
            let seriesData = { name: userInput,children:[]};
            
            if (userInput.split(' ').length === 2) {
                  strainl[userInput] = [userInput]; // 初始化每个物种的菌株数组
                  jsonData.Bac_Strain.forEach((strain) => {
                      if (strain.includes(userInput) && !strainl[userInput].includes(strain)) {
                          strainl[userInput].push(strain); // 将菌株添加到相应的物种数组中
                      }
                  });
                  
                for (let species in strainl) {
                  let index = seriesData.children.findIndex(child => child.name === species);
                  strainl[species].forEach(strain => {
                      seriesData.children.push({ name: strain });
                  });
              }
            }
            else{
              jsonData.Bac_Genus.forEach((genus, index) => {
                let speciesStrain = jsonData["Bac_Strain"][index];
                let species = speciesStrain.split(' ')[0]+' '+speciesStrain.split(' ')[1]; // 获取第一个空格前的单词作为物种名称
                if (genus === userInput && !Species.includes(species)) {
                    Species.push(species);
                }
            });

            Species.forEach(species =>{
                strainl[species] = []; // 初始化每个物种的菌株数组
                jsonData.Bac_Strain.forEach((strain) => {
                    if (strain.includes(species) && !strainl[species].includes(strain)) {
                        strainl[species].push(strain); // 将菌株添加到相应的物种数组中
                    }
                });
            });
            
            Species.forEach(species => {
                seriesData.children.push({ name: species, children: [] });
            });
            for (let species in strainl) {
              let index = seriesData.children.findIndex(child => child.name === species);
              strainl[species].forEach(strain => {
                  seriesData.children[index].children.push({ name: strain });
              });
            }}
            
            

            var myChart = echarts.init(document.getElementById('myChart'));
            const chartElement = document.getElementById('myChart');
            chartElement.style.display = 'block';
            chartElement.scrollIntoView({ behavior: 'smooth' });
            
            var option = {
                tooltip: {
                  trigger: 'item',
                  triggerOn: 'mousemove'
                },
                series: [
                  {
                    type: 'tree',
                    data: [seriesData],
                    top: '10%',
                    left: '17%',
                    bottom: '10%',
                    right: '40%',
                    symbolSize: 7,
                    label: {
                      position: 'left',
                      verticalAlign: 'middle',
                      align: 'right',
                      fontSize: 11
                    },
                    leaves: {
                      label: {
                        position: 'right',
                        verticalAlign: 'middle',
                        align: 'left'
                      }
                    },
                    emphasis: {
                      focus: 'descendant'
                    },
                    expandAndCollapse: true,
                    animationDuration: 550,
                    animationDurationUpdate: 750,
                    containLabel: true
                  }
                ]
              }
              myChart.on('click', function(params) {
                // 构建带参数的 URL
                var url = 'data.html?param1='+ encodeURIComponent(params.name) + '&param2=' + encodeURIComponent();
                window.open(url, '_blank'); // 在新窗口中打开页面
                // window.location.href = url; // 在当前窗口打开页面
            });
            myChart.setOption(option);
        });
    })



