
const fs = require('fs');
const path = require('path');
const argv = require('yargs').argv;
const Dirs = require('./dirs');

/* 
  @param name 项目名称
  @param v 版本号
  @param replace 是否替换已有json
*/
let { name = '', tag, replace = false, keyword = '' } = argv;
const apiDirName = tag || (keyword && `keyword_${toCamelCase(keyword)}`) || 'swagger';  // 模拟数据目录名称

function resolve(dir){
  return path.join(__dirname, './', dir);
}

function toCamelCase(str){
  let s =
    str &&
    str
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      .map(x => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
      .join('');
  return s.slice(0, 1).toLowerCase() + s.slice(1);
}

async function writeApiFiles(data){
  if(data.length == 0){
    let keywordMsg = (keyword && '，注：keyword参数首字母不能是 "/"' ) || '';
    console.error(`没有匹配的api哦~，请检查你的参数${keywordMsg}。`);
    return;
  }
  // console.log('data==>>>', data)
  let dirPath = resolve(`../scripts/data/${name}/${apiDirName}`);
  if(!Dirs.checkIsDir(dirPath)){
    await Dirs.mkdir(dirPath);
  }

  let apiUrlPath = resolve(`./api`);
  if(!Dirs.checkIsDir(apiUrlPath)){
    await Dirs.mkdir(apiUrlPath);
  }
 
  const apiJsonData = {};

  data.forEach(api=>{
    let { path,  responses} = api;
    let apiIndex = path.indexOf('api/');
    let wxappApiIndex = path.indexOf('wxapp/');
    let substrLength = 0;
    
    if(apiIndex > -1){
      substrLength = apiIndex + 4;
    }
    else if(wxappApiIndex > -1){
      substrLength = wxappApiIndex + 6;
    }

    const apiPath = path.substr(substrLength);
    const fileName = toCamelCase(apiPath);
    const filePath = `../scripts/data/${name}/${apiDirName}/${fileName}.json`;
    writeFile({filePath, fileName, content: responses});
    apiJsonData[fileName] = apiPath;
  })

  const apiFilePath = `./api/${name}.json`;
  writeFile({filePath: apiFilePath, content: apiJsonData}, {replace: true});
}

// 写入文件
function writeFile({filePath, fileName, content}, options = {}){
  options = Object.assign({}, { replace }, options)

  if(!Dirs.checkIsFile(resolve(filePath)) || options.replace == true){
    deleteRenameFile(fileName, filePath);
    fs.writeFile(resolve(filePath), JSON.stringify(content, null, "\t"), ()=>{})
  }
}

// 删除重名文件
function deleteRenameFile(fileName, filePath){
  const dirpath = resolve(`../scripts/data/${name}/`);
  let checked = false;
  Dirs.eachDirFiles(dirpath, ({file, filePath})=>{
    if(file.replace('.json', '') == fileName){
      checked = true;
      fs.unlinkSync(filePath, ()=>{});
    }
  })
  if(checked){
    console.log('移除旧文件并重写成功: ', filePath)
  } else{
    console.log('写入文件成功: ', filePath)
  }
}



module.exports = {
  writeApiFiles,
  writeFile
};