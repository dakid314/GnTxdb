/*
 * @Author: George Zhao
 * @Date: 2022-07-19 21:07:37
 * @LastEditors: George Zhao
 * @LastEditTime: 2022-07-19 23:49:44
 * @Description: 
 * @Email: 2018221138@email.szu.edu.cn
 * @Company: SZU
 * @Version: 1.0
 */
require("../scss/index.scss");
document.getElementById("main").querySelector("h1#loadingpage").remove();

let homepage_content = document.querySelector("[data_store]#homepage");
document.getElementById("main").innerHTML = homepage_content.innerHTML;
homepage_content.innerHTML = "";