#!/usr/bin/env electron

const fs = require('fs'),
      //util = require('util'),
      //url = require("url"),
      path = require("path"),
      electron = require("electron"),
      app = electron.app,
      ipc = electron.ipcMain,
      BrowserWindow = electron.BrowserWindow;

//electron-packager . sky-stream --platform=mas --arch=x64 --asar --app-copyright="(c)2018 Stac Apps" --icon=./icons/app/main.icns --app-bundle-id=com.stac.mediaplayer --app-category-type=public.app-category.media-player --overwrite
/*var appPaths = 'getPath("userData") = ' + app.getPath('userData') +
  '\ngetAppPath() = ' + app.getAppPath() +
  '\ngetPath("videos") = ' + app.getPath('videos') +
  '\ngetPath("exe") = ' + app.getPath('exe') +
  '\nTOKEN_PATH = ' + TOKEN_PATH;
*/

var mainWindow;

app.on('ready', function(){
  mainWindow = new BrowserWindow({
    width: 1020,
    height: 620,
    frame: false,
    transparent: true,
    backgroundColor: "#ff038188",
    icon: __dirname + "/icons/app/main.png",
    webPreferences: {nodeIntegration: true}
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  //mainWindow.webContents.openDevTools();
  mainWindow.webContents.on('did-finish-load', ()=>{
    //mainWindow.webContents.send('showAppPaths', appPaths);
    ///Get Local files.
    let localFiles = getLocalMedia();
    console.log(`\nFound a total of ${localFileCount} local files in ${app.getPath('videos')}`);
    for (let i of localFiles) console.log(i);
    mainWindow.webContents.send('files-list', localFiles);
  });
  mainWindow.on('close', ()=>app.quit());
});

app.on('window-all-closed', ()=>app.quit());

ipc.on('reload', ()=>{mainWindow.loadURL(`file://${__dirname}/index.html`)});

/**The number of local files found. Edit getLocalMedia to return this instead. */
var localFileCount;
/**Search local disks for media files. 
 * @param {string[]} dirList List of folders to check for media files. 
 * Searches sub-folders as well.
 * @param {string[]} dirExcludeList List of subfolders to be excluded from search.
 * @param {string[]} extList List of file extensions to look for.
 */
function getLocalMedia(
    dirList = [app.getPath('videos')],
    dirExcludeList = [],
    extList = ['.mp4', '.mkv']
  ){
  var localFiles = [];
  var fileCount = 0;
  for (let i of dirList) {
    if (!fs.existsSync(i)) {
      console.log(`The Folder "${i}" was not found`);
      continue;
    }
    let dir = fs.readdirSync(i);
    for (let fileName of dir) {
      let filePath = path.join(i, fileName)
      if (fs.lstatSync(filePath).isDirectory() && !dirExcludeList.includes(filePath))
        localFiles = localFiles.concat(getLocalMedia([filePath], dirExcludeList, extList));  //Using recursion to search subfolders.
      else {
        for (let ext of extList){
          if (fileName.lastIndexOf(ext) === fileName.length - ext.length) {
            fileCount = localFiles.push({path: filePath, name: fileName});
            break;
          }
        }
      }
    }
  }

  console.log(`Found ${fileCount} local files`);
  localFileCount = fileCount;
  return localFiles;
}