const argv = require('yargs').argv;
const File = require('./writeFile');
const { tag = '', keyword = '' } = argv;
let version = tag || '';

// 记录ref，防止递归死循环
let refTotal = [];

/*
  递归根据ref查找响应内容
*/
function findDefinitionsContent(definitions = {}, ref = ''){
  // console.log('ref', ref)
  ref = ref.replace('#/definitions/','');
  const findRefIndex = refTotal.findIndex(item=>{
    return item.ref === ref;
  })
  if(findRefIndex == -1){
    refTotal.push({ ref, count: 1 })
  } else {
    if(refTotal[findRefIndex].count >= 3){
      return {}
    }
    refTotal[findRefIndex].count++;
  }

  const { type, properties = {} } = definitions[ref];
  let data = {}
  if(type == 'object'){
    Object.keys(properties).forEach((key)=>{
      const childData = properties[key];
      if(childData.type == 'string'){
        data[key] = childData.example || 'string'
      }
      else if(childData.type == 'boolean'){
        data[key] = true
      }
      else if(childData.type == 'integer' || childData.type == 'number'){
        data[key] = childData.example || 0
      }
      else if(childData.type == 'array'){
        if(!Array.isArray(data[key])){
          data[key] = []
        }
        if(childData['items'] && childData['items']['$ref']){
          data[key].push(findDefinitionsContent(definitions, childData['items']['$ref']));
        }
        else if(childData['items'] && childData['items']['type']){
          let type = childData['items']['type']
          let example = childData.example
          let value = type == 'integer' ? 1 : 'string'
          data[key].push(example || value);
        }
      }
      else if(childData['$ref']){
        data[key] = findDefinitionsContent(definitions, childData['$ref']);
      }
    })
  }
  return data;
}

/*
  api响应数据
*/
function findResponseRef(request){
  try{
    const { responses: { '200': { schema : { '$ref': ref } } } } = request;
    return ref;
  }
  catch(e){
    // console.error(e)
  }
  return null;
}

/*
  生成当前版本swagger所有api
*/
function buildApiJson(json = {}){
  version = version.toLocaleUpperCase();
  const { paths, definitions } = json;
  const allApiData = [];

  Object.keys(paths).forEach((apiKey) => {
    const apiData = paths[apiKey];
    const { post, get } = apiData;
    const request = post || get;
    const { tags } = request;
    
    if(keyword && apiKey.indexOf(keyword) === -1){
      return;
    }
    if(tags){
      const isTag = tags.some(tag=>{
        return tag.indexOf(version) > -1
      })
      if(!isTag) return;
    }

    const ref = findResponseRef(request);
    if(!ref) return;

    const res = findDefinitionsContent(definitions, ref);
    const api = {
      path: apiKey,
      responses: res
    }
    allApiData.push(api);
  })

  File.writeApiFiles(allApiData);

  refTotal = []
}


module.exports = buildApiJson;

