/*
 * @Author: George Zhao
 * @Date: 2022-11-04 13:15:11
 * @LastEditors: George Zhao
 * @LastEditTime: 2022-11-04 13:16:43
 * @Description: 
 * @Email: 2018221138@email.szu.edu.cn
 * @Company: SZU
 * @Version: 1.0
 */
require("../scss/help.scss");
document.getElementById("main").querySelector("h1#loadingpage").remove();

let homepage_content = document.querySelector("[data_store]#help_page");
document.getElementById("main").innerHTML = homepage_content.innerHTML;
homepage_content.innerHTML = "";