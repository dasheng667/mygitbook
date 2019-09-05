const fs   = require('fs');
const path = require('path');
const paths = require('../../config/paths');
const argv = require('yargs').argv;

const appDirectory = fs.realpathSync(process.cwd());
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);

/* 
  多主题webpack插件
*/

class appThemeWebpcakPlugin{

  constructor(){
    this.projectName = argv.name;
    this.matchReg = /[.#]?\w+[^{]+\{[^}]*\}/g;
    this.appConfig = this.getAppThemeConfig();
    this.excludesPath = [
      '/activity/'
    ]
  }

  getAppThemeConfig(){
    let filename = resolveApp(`src/${this.projectName}/app.json`);
    let source = null;
    try{
      source = fs.readFileSync(filename, 'utf-8');
      source = JSON.parse(source)
      source = source.theme;
    }
    catch(e){

    }
    return source
  }

  hasExcudesPath(asset){
    return this.excludesPath.some(path=>{
      return asset.indexOf(path) !== -1;
    })
  }

  filterCSSMainColor(source){
    let cssArr = source.match(this.matchReg);
    if(!cssArr || cssArr.length == 0) return '';
    let mainColor = this.appConfig.main.split(',');
    let matchArr = cssArr.filter(css=>{
      if(css.indexOf(mainColor[0]) > -1 || css.indexOf(mainColor[1]) > -1){
        return css;
      }
    })
    return matchArr.join('');
  }

  setThemeCSSAssets(sourceArr, color){
    let source = sourceArr.join('');
    let colors = color.split(',');
    let mainColor = this.appConfig.main.split(',');
    let reg0 = new RegExp(mainColor[0], 'gi');
    let reg1 = new RegExp(mainColor[1], 'gi');
    source = source.replace(reg0, colors[0]).replace(reg1, colors[1]);
    return {
      source: function(){
        return source
      },
      size: function(){
        return source.length;
      }
    }
  }

  themeHeaderJavaScriptCode(){
    var publicPath = paths.publicPath;
    return `<script>(function() {
      var storage = localStorage.getItem('theme');
      if(storage){
        var head = document.querySelector('head');
        var links = document.querySelectorAll('link');
        var lastlink = links[links.length - 1];
        var link = document.createElement('link');
        link.href = '${publicPath}mall/theme_'+storage+'.css';
        link.rel = 'stylesheet';
        head.appendChild(link)
      }
    })();</script>`
  }

  insertThemeJStoHead(source){
    var code = this.themeHeaderJavaScriptCode();
    source = source.replace('</head>', `${code}</head>`)
    return {
      source: function(){
        return source
      },
      size: function(){
        return source.length;
      }
    }
  }

  apply(compiler) {
    if(!this.appConfig || !this.appConfig.main || !this.appConfig.list) return
    let themeCSS = [];
    let appThemeList = this.appConfig.list;
    compiler.hooks.emit.tap('appThemePlugin', (compilation)=>{

      Object.keys(compilation.assets).forEach( asset => {
        if(asset.indexOf('.css') > -1 && !this.hasExcudesPath(asset)){
          let source = compilation.assets[asset].source();
          let css = this.filterCSSMainColor(source);
          if(css){
            themeCSS.push(css);
          }
        }

        if(asset.indexOf('.html') > -1 && !this.hasExcudesPath(asset)){
          let source = compilation.assets[asset].source();
          compilation.assets[asset] = this.insertThemeJStoHead(source);
        }
      })

      Object.keys(appThemeList).forEach(themeName=>{
        let themePath = `${this.projectName}/theme_${themeName}.css`;
        let color = appThemeList[themeName];
        compilation.assets[themePath] = this.setThemeCSSAssets(themeCSS, color);
        console.log(`Mall生成主题 theme_${themeName}.css`);
      })
      
    });
  }

}

module.exports = appThemeWebpcakPlugin