#### 使用说明: 生成你所需要的接口对象

###### 1. 执行脚本;
   
```
node index.js --name=oms --url=http://fedev.ff.com/boms/api/v2/api-docs
node index.js --name=mall --tag=V1.11.0
```

###### 2. 参数说明;
```
(一). name: （必填）项目名称, 当你使用开发环境的文档是name就行, 如果是用本地的swagger, 必须传入url;
(二). url: 用本地的swagger, 必须传入url, url为 ip + 端口号;
(三). tag: （必填）需要获取的版本号;
(四). keyword: 根据关键字获取api列表，可以和tag同时存在;
(五). replace: 是否需要替换已有的api文件;
```


