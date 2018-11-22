const util = require('util'),
      fs = require('fs'),
      //url = require("url"),
      path = require("path"),
      electron = require("electron"),
      app = electron.app,
      ipc = electron.ipcMain,
      BrowserWindow = electron.BrowserWindow,
      
      {google} = require('googleapis'),
      SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/userinfo.profile'],
      OAuth2Client = google.auth.OAuth2;

fs.mkdir(path.join(app.getPath('userData'), 'googleapi'), 
          (err)=>
                {
                  if (err && err.code == 'EEXIST')
                    return;
                  //else send error message to mainWindow
                }
        );
//electron-packager . sky-stream --platform=mas --arch=x64 --asar --app-copyright="(c)2018 Stac Apps" --icon=./icons/app/main.icns --app-bundle-id=com.stac.mediaplayer --app-category-type=public.app-category.media-player --overwrite
const TOKEN_PATH = path.join(app.getPath('userData'), '/googleapi/credentials.json');
var appPaths = 'getPath("userData") = ' + app.getPath('userData') + '\ngetAppPath() = ' + app.getAppPath() + '\ngetPath("exe") = ' + app.getPath('exe') + '\nTOKEN_PATH = ' + TOKEN_PATH;

var mainWindow,
    auth; //Global variable for authorized OAuth2 client.

//
app.on('ready',
        function()
          {
            mainWindow = new BrowserWindow({width: 1020, height: 620, frame: false, transparent: true, icon: __dirname + "/icons/app/main.png"});
            mainWindow.loadURL(`file://${__dirname}/index.html`);
            //mainWindow.webContents.openDevTools();

            mainWindow.webContents.on('did-finish-load',
                                        ()=>{
                                              mainWindow.webContents.send('showAppPaths', appPaths);//
                                              fs.readFile(`${__dirname}/googleapi/client_secret_desktop.json`,    // Load client secrets from local file.
                                                            (err, content)=>
                                                              {
                                                                if (err) return console.log('Error loading client secret file:', err);
                                                                //console.log('Finished loading client secret file');
                                                                authorize(JSON.parse(content), listFiles);  // Authorize a client with credentials, then call the Google Drive API.
                                                              }
                                                          );
                                            }
                                        );
            mainWindow.on('close', ()=>app.quit());
          }
      );
app.on('window-all-closed', ()=>app.quit());

ipc.on('sign-in', ()=>getAccessToken(listFiles));

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback)
  {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    auth = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH,
                  (err, token) =>
                    {
                      if (err)
                        {
                          mainWindow.webContents.send('show-sign-in');
                          return console.log("\nFailed to load access token from local. User must sign-in"); //getAccessToken(oAuth2Client, callback);
                        }
                      auth.setCredentials(JSON.parse(token));
                      callback(auth);
                    }
                );
  }

/**
* Get and store new token after prompting for user authorization, and then
* execute the given callback with the authorized OAuth2 client.
* @param {getEventsCallback} callback The callback for the authorized client.
*/
function getAccessToken(callback)
  {
    const authUrl = auth.generateAuthUrl({access_type: 'offline', scope: SCOPES});

    //OPEN POP-UP AND LOAD URL.
    authPopup = new BrowserWindow({width: 450, height: 500, frame: false, parent: mainWindow});
    authPopup.loadURL(authUrl);

    //GET the CODE FROM THE POP-UP WINDOW.
    authPopup.webContents.on('did-navigate', //Necessary for to fire dom-ready after each navigation.
                              (event, url)=>{
                                  authPopup.webContents.on('dom-ready',
                                                             ()=>{
                                                                  authPopup.webContents.executeJavaScript(`
                                                                                                            const ipc = require('electron').ipcRenderer;
                                                                                                            var pageTitle = document.querySelector("title").innerHTML;
                                                                                                            if (pageTitle != "Sign in - Google Accounts")
                                                                                                            ipc.send("titleChange", pageTitle);
                                                                                                          `);
                                                                  }
                                                           );
                                }
                            );

    ipc.on('titleChange',
            (event, pageTitle) => {
                  if (/Error/.test(pageTitle))
                    {
                      authPopup.close();
                      authPopup = null;
                      mainWindow.webContents.send('error', pageTitle);
                    }
                  else if (/Success/.test(pageTitle))
                    {
                      authPopup.close();
                      authPopup = null;
                      let code = pageTitle.replace("Success code=", "");
                      exchangeCode(code);
                    }
              }
            );

    //Exchange the returned code for access token.
    function exchangeCode(code)
      {
          auth.getToken(code,
                         (err, token)=>{
                              if (err) return mainWindow.webContents.send('error', util.inspect(err));
                              auth.setCredentials(token);
                              // Store the token to disk for later program executions
                              fs.writeFile(TOKEN_PATH,
                                            JSON.stringify(token),
                                              (err)=>{
                                                 if (err) return console.error(err);
                                                 console.log('Token stored to', TOKEN_PATH);
                                                }
                                          );
                              callback();
                            }
                       );
      }
  }

//
function listFiles()
 {
   const drive = google.drive({version: 'v3', auth});
   var nextPageToken = null;
   var didFindFiles = false;
   do {
        drive.files.list({ fields: 'nextPageToken, files(id, name, parents, webViewLink, thumbnailLink, videoMediaMetadata, mimeType)',
                            q: "mimeType contains 'video'",
                            pageToken: nextPageToken
                          },
                            (err, res) => {
                                if (err)
                                    return mainWindow.webContents.send('error', util.inspect(err));

                                 //Assign returned files to an array 'files'.
                                let files = res.data.files;
                                //console.log('\n\nNext Token: \n\t' + res.data.nextPageToken);

                                if (files.length)
                                  {
                                    if (!didFindFiles) didFindFiles = true;

                                    mainWindow.webContents.send('files-list', files);
                                  }

                                if (res.data.nextPageToken)
                                  nextPageToken = res.data.nextPageToken;

                                if (!nextPageToken)
                                  if (!didFindFiles)
                                    mainWindow.webContents.send('error', 'No files found.');
                              }
                        )
      } while (!!nextPageToken);
  }

ipc.on('getFolderName',
        (event, folderId)=>{
            const drive = google.drive({version: 'v3', auth});
            drive.files.get( {fileId: folderId, fields: 'name'},
                              (err, res)=>{
                                  if (err)
                                      return mainWindow.webContents.send('error', util.inspect(err));
                                  let folderInfo = {id: folderId, name: res.data.name}
                                  mainWindow.webContents.send('gottenFolderName', folderInfo);
                                }
                            );
          }
      );

var playWindow; //Declare global variable playWindow, the window in which the video is streamed.
ipc.on("play", (e, link)=>{
                    playWindow = new BrowserWindow({ width: 1020,
                                                     height: 620,
                                                     transparent: true,
                                                     backgroundColor: '#FF0381',
                                                     show: false,
                                                     autoHideMenuBar: true
                                                    }
                                                  );
                    playWindow.loadURL(link, {userAgent: 'Mozilla/5.0 (compatible, MSIE 11, Windows NT 6.3; Trident/7.0;  rv:11.0) like Gecko'});
                    //playWindow.webContents.once('dom-ready', ()=>playWindow.show());
                    playWindow.webContents.once('did-finish-load', ()=>{if (!playWindow) return; playWindow.show(); mainWindow.hide();});
                    playWindow.on('close', ()=>{mainWindow.show(); mainWindow.webContents.send('close-video'); playWindow=null;});
                  }
      );

ipc.on("close-video", ()=>{
                            if (playWindow)
                              playWindow.close();
                          }
      );

ipc.on('reload', ()=>mainWindow.loadURL(`file://${__dirname}/index.html`));

/*renderer process (mainWindow)
let modal = window.open('', 'modal')
modal.document.write('<h1>Hello</h1>')*/

//'Mozilla/5.0 (Linux; U; Android 6.0; en-US; Infinix HOT 4 Build/MRA58K) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.108 UCBrowser/12.0.0.1088 Safari/537.36'
