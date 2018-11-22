const electron = require("electron");
const ipc = electron.ipcRenderer;
thisWindow = electron.remote.getCurrentWindow();

var contentWrapper = document.querySelector("#content-wrapper");
var body = document.querySelector('body');

ipc.on('showAppPaths', (e, appPaths) => {
                          window.alert(appPaths);
                        }
       );

//Disable drag and drop.
document.ondragstart = ()=>{
                             if (!event.target.classList.contains('draggable'))
                               {
                                 event.preventDefault();
                                 return false;
                                }
                            }
//Base buttons
document.querySelector("#devTools").onclick = ()=> thisWindow.toggleDevTools();
document.getElementById("sign-in").onclick = ()=>ipc.send('sign-in');
document.getElementById('reload').onclick = ()=>{ location.reload(); ipc.send('reload'); }

//Video frame.
var videoLoading = document.getElementById("video-loading"),
    loadingBg = document.getElementById("video-loading-bg"),
    loadingImg = document.getElementById("video-loading-img"),
    //
    closeVideoButton = document.getElementById("close-video");
    closeVideoButton.onclick = (e)=>{
                                     ipc.send('close-video');
                                     closeVideoButton.style.display = "none";
                                    }
var clickBlocker = document.getElementById("click-blocker");
var titleBar = document.querySelector('#titleBar');
/*var appIconDiv = document.getElementById("appIconDiv");*/

//Window buttons
var maxicon = "./icons/maximize/initial.png"; //Maximize icon, to be shown when window is at initial size.
var resticon = "./icons/restore/initial.png"; //Restore icon, to be show when window is maximized.
var windowButtons = document.querySelectorAll(".windowButtons");

for  (let x=0; x<windowButtons.length; x++)
  {
    windowButtons[x].addEventListener('mouseover',  
                                        (e) => {
                                                  //Highlight the button
                                                  e.currentTarget.style.backgroundColor = "rgb(234, 43, 110)";
                                                  //Point to the img within the div
                                                  let selector = "#" + e.currentTarget.id + " img";
                                                  //Creat path to white icon
                                                  let newimg = document.querySelector(selector).src.replace(/initial/, "onhover");
                                                  //Switch the icon
                                                  document.querySelector(selector).src = newimg;
                                                  //Scale down maximize icon.
                                                  if (e.currentTarget.id == "maximizeBtn")
                                                    { //Scale down the white img.
                                                      document.getElementById("maximizeImg").style.height = "13px";
                                                      document.getElementById("maximizeImg").style.width = "13px";
                                                    }
                                                }
                                      );

    windowButtons[x].onmouseout = (e)=>{
                                         //Remove background color
                                         e.currentTarget.style.backgroundColor = "transparent";
                                         //Point to img within div
                                         let selector = "#" + e.currentTarget.id + " img";
                                         //Create path to colored icon.
                                         let newimg = document.querySelector(selector).src.replace(/onhover/, "initial");
                                         //Switch the icon.
                                         document.querySelector(selector).src = newimg;
                                         //Restore default maximize icon size.
                                         if (e.currentTarget.id == "maximizeBtn")
                                          {
                                            document.getElementById("maximizeImg").style.height = "15px";
                                            document.getElementById("maximizeImg").style.width = "15px";
                                          }
                                        }
  }

document.querySelector("#minimizeBtn").onclick = (e)=>{
                                                        //Point to the img within the div.
                                                        let selector = "#" + event.currentTarget.id + " img";
                                                        //Create path to colored icon.
                                                        let newimg = document.querySelector(selector).src.replace(/onhover/, "initial");
                                                        //Change icon.
                                                        document.querySelector(selector).src = newimg;
                                                        //Remove background color.
                                                        event.currentTarget.style.backgroundColor = "transparent";
                                                        //Finally, do the thing!
                                                        setTimeout(thisWindow.minimize(), 300);
                                                      }

document.querySelector("#maximizeBtn").onclick = (e)=>{
                                                        //Remove background color after click event.
                                                        e.currentTarget.style.backgroundColor = "transparent";
                                                        if (thisWindow.isMaximized()) 
                                                          {
                                                            //Restore window to initial size.
                                                            thisWindow.unmaximize();
                                                            //Point to the img within the div
                                                            let selector = "#" + e.currentTarget.id + " img";
                                                            //Change restore icon to maximmize icon.
                                                            document.querySelector(selector).src = maxicon;
                                                          }
                                                        else
                                                          {
                                                            //Maximize the window.
                                                            thisWindow.maximize();
                                                            //Point to the img within the div
                                                            let selector = "#" + e.currentTarget.id + " img";
                                                            //Change maximmize icon to restore icon.
                                                            document.querySelector(selector).src = resticon;
                                                          }
                                                      }

document.querySelector("#closeBtn").onclick = (e)=>{
                                                      //Remove background color after click event.
                                                      e.currentTarget.style.backgroundColor = "transparent";
                                                      setTimeout(thisWindow.close(), 300);
                                                      /**Consider minimize window, then countdown to allow undo before finally closing.*/
                                                    }
//End windowButtons event listeners.                                                    

//IPC Event Listeners.
ipc.on('show-sign-in', ()=>document.getElementById('sign-in').style.visibility = "visible");
//
ipc.on('error', (e, errorMessage) => {
                          let errorText = document.createElement("p")
                          errorText.innerHTML = "ERROR:- " + errorMessage;
                          contentWrapper.appendChild(errorText);
                        }
       );
    //
ipc.on('gottenFolderName', (e, folderInfo)=>{
                              let thisLabel = document.querySelector(`#a${folderInfo.id} > p`);
                              thisLabel.innerHTML = `${folderInfo.name}`;
                            }
      );
    //
ipc.on('files-list', (event, files) => {
                          files.forEach((videoFile) => {
                                            var videoCard = new VideoCard(videoFile);
                                            videoCard.rootDiv.onclick = (e)=>{
                                                                           if (e.target.classList.contains("thumbnail"))
                                                                             loadVideo(`${videoFile.webViewLink}`, `${videoCard.cardId}`);
                                                                          }
                                            videoCard.parentDiv.appendChild(videoCard.rootDiv);
                                          }
                                       );
                       }
       );

/*Create a card for each video file*/
function VideoCard(fileInfo)
  {
    var folderDivId = 'a' + fileInfo.parents[0];
    var folderId = fileInfo.parents[0];
    this.cardId = 'a' + fileInfo.id;

    this.rootDiv = document.createElement("div");
    this.rootDiv.setAttribute("id", this.cardId);

    //Create a container for the current file's folder if it doesn't already exist.
    if (!document.getElementById(folderDivId))
      {
        let newFolderDiv = document.createElement("div");
        newFolderDiv.setAttribute("id", folderDivId);
        newFolderDiv.className = "video-group";

        let folderLabel = document.createElement("p");
        let label = document.createTextNode(`Folder ID:- ${folderId}`);
        folderLabel.appendChild(label);

        let videoCardsWrapper = document.createElement("div");
        videoCardsWrapper.className = "inline-blocks-wrapper";

        newFolderDiv.appendChild(folderLabel);
        newFolderDiv.appendChild(videoCardsWrapper);

        ipc.send('getFolderName', folderId);
        contentWrapper.appendChild(newFolderDiv);
      }

    //Assign this.parentDiv to the corresponding container based on the current file's folder.
    this.parentDiv = document.querySelector(`#${folderDivId} > .inline-blocks-wrapper`);

    this.rootDiv.innerHTML = `<img class="thumbnail" src="${fileInfo.thumbnailLink}">
                              <div class="w3-panel">
                                <p class="video-title">${fileInfo.name}</p>
                                <p class="video-length">${fileInfo.videoMediaMetadata.durationMillis}</p>
                              </div>`;
                              //
    this.rootDiv.classList.add('video-card', 'inline-block-element');
  }

//Declare the following global variables for use in functions loadVideo and closeVideo.
var card, cardClone, thumbnail, cardLabel, initialP, winDimension, frame, leftP, topP;

function loadVideo(link, cardId)
  {
    card = document.getElementById(cardId);
    cardClone = card.cloneNode(true);
    thumbnail = cardClone.querySelector('.thumbnail');
    cardLabel = cardClone.querySelector('div');
    initialP = card.getBoundingClientRect();  //Get the current coordinates of the card in relation to the viewport. This is the starting point for the transition.
    winDimension = body.getBoundingClientRect();
    frame  = {       //Final dimensions of the card at transition end. This is the same position as the video frame window.
                    top: (10/100) * winDimension.height,
                    left: (10/100) * winDimension.width,
                    width: (80/100) * winDimension.width,
                    height: (80/100) * winDimension.height
                  }

    cardClone.id = `${cardId}-clone`;
    cardClone.classList.remove("inline-block-element");
    body.appendChild(cardClone);
    //card.style.visibility = 'hidden';
    card.style.opacity = '0';
    cardClone.style.zIndex = '2';    //Elevate the card above other elements.
    cardClone.style.position = 'absolute';
    cardClone.style.left = `${initialP.left - 1}px`; //Subtract 1px of the Window border
    cardClone.style.top = `${initialP.top - 1}px`; //1px window border.
    cardClone.style.transition = 'all 1s';

    setTimeout(()=>{ //Set a delay after creating the card clone before starting transition to ensure animation is shown.
                      //Dim the window in the background and prevent clicking outside the video frame.
                        clickBlocker.style.display = "block";
                        setTimeout(()=>{
                                        clickBlocker.style.opacity = "0.56";
                                        titleBar.style.opacity = "0.54";
                                       },
                                   500
                                  );

                      //Begin animation.
                       //Increase card size and center.
                        leftP = ((winDimension.width/2)-(initialP.width/2))*100 / winDimension.width; //Calculate where the final position of the card should be in %viewport-width.
                        topP = ((winDimension.height/2)-(initialP.height/2))*100 / winDimension.height; //Calculate where the final position of the card should be in %viewport-height.
                        cardClone.style.transform = `scale(${frame.width / initialP.width}, ${frame.height / initialP.height})`; //translate(${(leftP - initialP.left)/(frame.width / initialP.width)}px, ${(topP - initialP.top)/(frame.height / initialP.height)}px)
                        cardClone.style.left = `${leftP}vw`;
                        cardClone.style.top = `${topP}vh`;
                        cardClone.style.borderRadius = '4px';
                        cardClone.style.boxShadow = '0px 0px 10px 1px rgba(0,0,0,0.8)'

                       //Expand thumbnail to fill entire card, Shrink the Card label.
                        thumbnail.style.height = "100%";
                        thumbnail.style.bottom = "0";
                        thumbnail.style.borderRadius = '4px';
                        thumbnail.style.boxShadow = 'none';
                        //thumbnail.style.opacity = "0.8";
                        cardLabel.style.height = "0";
                        cardLabel.style.bottom = "0";

                       //Play loading loading animation.
                        setTimeout(()=>{
                                          videoLoading.style.visibility = "visible";
                                          videoLoading.style.opacity = "1";
                                          loadingBg.style.animation = "loading-bg .9s ease .2s infinite alternate"; //Play animation.
                                          loadingImg.style.animation = "loading-img .9s linear .2s infinite alternate";
                                          closeVideoButton.style.display = "initial"; //Show close button.
                                        },
                                    1000
                                  );
                    },
                100
              );

    ipc.send('play', link); //Tell the main process to load the video. //https://drive.google.com/file/d/0B0W8cwh65D-fV3ppcXEtWXRsYUE/preview"
  }

ipc.on('close-video',
        ()=>{
              //Begin the reverse transition;
              videoLoading.style.visibility = "hidden";
              closeVideoButton.style.display = "none";
              clickBlocker.style.opacity = "0";
              titleBar.style.opacity = "initial";

              cardClone.style.transform = `scale(1,1)`; //${ initialP.width/frame.width}, ${initialP.height/frame.height}
              cardClone.style.left = `${initialP.left - 1}px`; //Subtract 1px of the Window border
              cardClone.style.top = `${initialP.top - 1}px`;
              cardClone.style.borderRadius = '10px';
              cardClone.style.boxShadow = '0 0 10px 1px rgba(0,0,0,0.2), 0 0 20px 1px rgba(0,0,0,0.19)';

             //Restore thumbnail and Card label.
              thumbnail.style.height = "50%";
              thumbnail.style.bottom = "50%";
              thumbnail.style.borderRadius = '10px 10px 0 0';
              thumbnail.style.boxShadow = '1px -4px 5px 1px rgba(0, 0, 0, 0.212), -1px -3px 5px 1px rgba(0, 0, 0, 0.178)';
              cardLabel.style.height = "initial";
              cardLabel.style.bottom = "10px";

              //
              setTimeout(()=>{
                            card.style.opacity = '1';
                            //card.style.visibility = 'visible';
                            //console.log(body.id + '\n\n' + cardClone.id);
                            body.removeChild(cardClone);//Delete the element altogether because memory.
                            //cardClone = null;
                            clickBlocker.style.display = "none";
                          },
                          1001
                        );
            }
      );

var tabs = document.querySelectorAll(".tabs > span");
var currentTab = document.querySelector("#videos-tab");
tabs.forEach(
              (tab)=>{
                       tab.onclick = (e)=>switchTab(e.currentTarget);
                      }
            );

function switchTab(clickedTab)
  {
    //restore the currently selected tab to default styles.
    currentTab.style.padding = "5px 10px 0 10px";
    currentTab.style.float = "left";
    currentTab.style.color = "rgba(255, 255, 255, 0.226)";
    currentTab.style.border = "none";
		currentTab.style.marginBottom = "initial";

    //Highlight the newly selected tab.
    clickedTab.style.color = "rgba(255, 255, 255, 0.8)";
		clickedTab.style.border = "1px solid rgba(0, 0, 0, 0.5)";
		clickedTab.style.borderBottom = "none";
		clickedTab.style.marginBottom = "-1px";

    currentTab = clickedTab;
  }

var videosIcon = document.querySelector("#videos-icon");
var audiosIcon = document.querySelector("#audios-icon");
var photosIcon = document.querySelector("#photos-icon");
var infoIcon = document.querySelector("#info-icon");
var settingsIcon = document.querySelector("#settings-icon");
var accountIcon = document.querySelector("#account-icon");
var otherSections = document.querySelector("#other-sections");
//var tabBars = document.querySelectorAll(".tabs");
currentTabsBar = document.querySelector("#video-tabs");

videosIcon.onclick = (e)=>{
                            otherSections.style.display = "none";
                            contentWrapper.style.opacity = "1";
                            currentTabsBar.style.display = "none";
                            thisTabsBar = document.getElementById("video-tabs");
                            thisTabsBar.style.display = "initial";
                            currentTabsBar = thisTabsBar;
                            switchTab(thisTabsBar.firstElementChild);
                          }

audiosIcon.onclick = (e)=>{
                            otherSections.style.display = "block";
                            contentWrapper.style.opacity = "0";
                            otherSections.src = "WIP.html";
                            currentTabsBar.style.display = "none";
                            thisTabsBar = document.getElementById("music-tabs");
                            thisTabsBar.style.display = "initial";
                            currentTabsBar = thisTabsBar;
                            switchTab(thisTabsBar.firstElementChild);
                          }

photosIcon.onclick = (e)=>{
                            otherSections.style.display = "block";
                            contentWrapper.style.opacity = "0";
                            otherSections.src = "WIP.html";
                            currentTabsBar.style.display = "none";
                            thisTabsBar = document.getElementById("photo-tabs");
                            thisTabsBar.style.display = "initial";
                            currentTabsBar = thisTabsBar;
                            switchTab(thisTabsBar.firstElementChild);
                          }

infoIcon.onclick = (e)=>{
                          otherSections.style.display = "block";
                          contentWrapper.style.opacity = "0";
                          otherSections.src = "WIP.html";
                          currentTabsBar.style.display = "none";
                          thisTabsBar = document.getElementById("info-tabs");
                          thisTabsBar.style.display = "initial";
                          currentTabsBar = thisTabsBar;
                          switchTab(thisTabsBar.firstElementChild);
                        }

settingsIcon.onclick = (e)=>{
                            otherSections.style.display = "block";
                            contentWrapper.style.opacity = "0";
                            otherSections.src = "WIP.html";
                            currentTabsBar.style.display = "none";
                            thisTabsBar = document.getElementById("settings-tabs");
                            thisTabsBar.style.display = "initial";
                            currentTabsBar = thisTabsBar;
                            switchTab(thisTabsBar.firstElementChild);
                          }

accountIcon.onclick = (e)=>{
                            otherSections.style.display = "block";
                            contentWrapper.style.opacity = "0";
                            otherSections.src = "WIP.html";
                            currentTabsBar.style.display = "none";
                            thisTabsBar = document.getElementById("account-tabs");
                            thisTabsBar.style.display = "initial";
                            currentTabsBar = thisTabsBar;
                            switchTab(thisTabsBar.firstElementChild);
                          }
