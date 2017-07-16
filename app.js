/*********************************************
 * by:Kun time :2017/7/16 desc:fetch2.0meizi *
 *********************************************/
var superagent =  require('superagent-charset')(require('superagent'));
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var mkdirp = require('mkdirp');
var path = require('path');
var dirname =  './img/meizi.txt';
var data = JSON.parse(fs.readFileSync(dirname));
console.log(data.length);

//并发请求处理
async.mapLimit(data,20,function(item,callback){
    fetchNowMaxNumber(item,callback);
},(error,result)=>{
    if(error){
        console.log(error);
    }else{
        console.log(result);
    }
})

//获取每个图集的总图数
async function fetchNowMaxNumber(item,callback){
    get_max_number(item.url,(max)=>{
        callback(null,max);
    });
}

//另外一种方法
function get_max_number(url,callback) {
    superagent
        .get(url)
        .set('Connection','keep-alive')
        .set('User-Agent','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36')
        .set('Host', 'www.mzitu.com')
        .end(function (err, sres) {
            // 常规的错误处理
            if (err) {
                console.log('错误：',err)
            }
            if(!err && sres.statusCode == 200){
                let $ = cheerio.load(sres.text);
                let $element = $('body > div.main > div.content > div.pagenavi').find('a').last().prev();
                let max = $element.attr('href').split('/')[4];
                downloadImg(url,max);
                callback(max)
            }
        });
}

//请求获取每个页面的总数图
// function callTotalPage(item,callback){
//         let options = {
//             url: item.url,
//             headers: {
//                 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
//                 'Connection': 'keep-alive'
//             }
//         }
//         console.log(item.url);
//         request(options, (error, response, body) => {
//             if (error) {
//                 console.log(error)
//             }
//             if (!error && response.statusCode == 200) {
//                 let $ = cheerio.load(body);
//                 $event = $('body > div.main > div.content > div.pagenavi').find('a').last().prev()
//                 let max = $event.attr('href').split('/')[4];
//                 // downloadImg(url,max);
//                 console.log(max);
//                 callback(max);
//             }
//         })
// }

//下载图集
function downloadImg(url, max) {
    dirname = url.split('/')[3];
    console.log(dirname);
    pathName = `image\/${dirname}`;
    createDir(pathName);
    for(i = 1;i <= max;i++){
        let text =  `${url}/${i}`;
        let options = {
            url: text,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
                'Connection': 'keep-alive'
            }
        } 
    request(options, (error, response, body) => {
            if (error) {
                console.log(error);
                downloadImg(url, max, body);
                return false;
            } else if (!error && response.statusCode == 200) {
                let $ = cheerio.load(body);
                $event = $('body > div.main > div.content > div.main-image > p > a > img');
                let imgSrc = $event.attr('src');
                let fileName = createFileName(imgSrc)
                writeFile(dirname,imgSrc,fileName);
                console.log(pathName,imgSrc);
            }
        })
    }
}

//生成文件名
function createFileName(address){
    let filename = path.basename(address);
    return filename;
}

//写入文件
function writeFile(dirname,imgSrc,fileName){
    let options ={
        url: imgSrc,
        encoding: 'binary',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36',
             'Connection': 'keep-alive'
        }
    }
    request(options, function (error, response, body) {
        if(error){
            console.log("错误:",error);
        }
        if (!error && response.statusCode == 200) {

            fs.writeFile('image/' + dirname+'/'+ fileName, body, 'binary', function (err) {
                if(err){ 
                    console.log(err);
                }
                console.log(`开始下载:${imgSrc}done`);
            });
            let result = true;
        }
         if(!error&&response.statusCode == 404){
            console.log('没有东西了')
            let result =  false;
        }
    });
}

//创建目录
function createDir(pathName){
    mkdirp(pathName,(err)=>{
        if(err){
            console.log(err);
        }else{
            console.log(`${pathName}目录已创建`);
        }
    })
}