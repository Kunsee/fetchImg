/*********************************************
 * by:Kun time :2017/7/15 desc:fetch2.0meizi *
 *********************************************/

//爬取mezitu
var superagent = require('superagent-charset')(require('superagent'));
var request = require('request');
var cheerio = require('cheerio');
var path = require('path');
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');

var url = 'http://www.mzitu.com/';
var options = {
    url: url,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
        'Connection': 'keep-alive'
    }
}

//入口文件
startDone(options);
async function startDone(options) {
    let totalPage = await requestTotalPage(url);
    let arrUrl = [];
    let resultUrlArr = [];
    let text;
    for (let i = 1; i <= totalPage; i++) {
        let resultUrl = `${options.url}page/${i}/`;
        text = await fetchImgCollections(resultUrl);
        console.log(i, ':', text.length);
        arrUrl = arrUrl.concat(text)
        resultUrlArr.push(resultUrl);
    }
    writeFile(arrUrl, './img/', 'meizi')
    console.log(`总共有${totalPage}`);
}


//请求获取页面总数
function requestTotalPage(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            let $ = cheerio.load(body);
            let totalPage = $('body > div.main > div.main-content > div.postlist > nav > div > a:nth-child(6)').toArray()[0];
            totalPage = totalPage.attribs.href.split('/')[4];
            resolve(totalPage)
        })
    })
}

//获取图集url
function fetchImgCollections(url, callback) {
    return new Promise((resolve, reject) => {
        options = {
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
                'Connection': 'keep-alive'
            }
        }
        request(options, (error, response, body) => {
            let arrUrl = [];
            if (error) {
                console.log(error);
            }
            if (!error && response.statusCode == 404) {
                console.log(404);
            }
            if (!error && response.statusCode == 200) {
                let $ = cheerio.load(body);
                $('#pins').find('li').each((idx, element) => {
                    $event = $(element);
                    let url = $event.find('span:nth-child(2) > a').toArray()[0].attribs.href;
                    let title = $event.find('span:nth-child(2) > a').text();
                    let text = {
                        url: url,
                        title: title
                    }
                    arrUrl.push(text);
                })
            }
            resolve(arrUrl);
        })
    })
}

//写入文件
function writeFile(arrUrl, dir, filename) {
    console.log(`获取到${arrUrl.length}画集`)
    let dirname = dir + filename + '.txt';
    mkdirp(dir, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('目录已创建');
        }
    })
    fs.writeFileSync(dirname, JSON.stringify(arrUrl));
}