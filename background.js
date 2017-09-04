// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Step 1: periodically query chrome to find downloaded links
var downloadedURLs = {}
var updateDownloaded = function () {
    console.log("Downloaded URL: " + Object.keys(downloadedURLs).length)
    chrome.downloads.search({}, function (results) {
        var found = null
        for (var i = 0; i < results.length; i ++) {
          downloadedURLs[results[i].url] = 1
        }
    })
}
setInterval(updateDownloaded, 3000);


var year = -1
var page_from = -1
var page_to = -1
var page_to_click = -1
var search_res_page = -1
var downloadURLPortName = "downloadurl"
var pageNavPortName = 'pageNav'

// Step 2 listen on a port waiting for queries
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name == downloadURLPortName) {
    console.log("Receive downloadURLPort")
    port.onMessage.addListener(downloadurlListener)
  } else if (port.name = pageNavPortName) {
    console.log("Receive page nav port")
    port.onMessage.addListener(pageNavListener)
  }
})



var goto_and_start_click = function(tab_id, page_num){
    // send a goto message and then send a click
    console.log("Sending goto command to page:" + page_num)
    chrome.tabs.sendMessage(search_res_page, {command: "goto", pageno: page_num})

    // then should send a click events
    var send_click = function(){
        console.log("sending click command")
        chrome.tabs.sendMessage(search_res_page, {command: "click"})
    }
    setTimeout(send_click, 10000) // wait 10 seconds until next
} // end goto_and_start_click

var pageNavListener = function(msg, sendingPort) {
    // communicate with popup.js to get page information
    console.log("receive message for pageNav: " + JSON.stringify(msg) )

    if (msg.command == "start") {
      page_from = msg.page_from
      page_to = msg.page_to
      page_to_click = msg.page_from
      search_res_page = msg.tab_id

      chrome.storage.local.set({
        'progress': page_to_click,
        'start': page_from,
        'end': page_to,
      })
      goto_and_start_click(search_res_page, page_to_click)

    } else if (msg.command == "finish") {
      console.log("Finished " + msg.page_no)

      // page_to_click = parseInt(msg.page_no) + 1
      page_to_click += 1
      chrome.storage.local.set({
        'progress': page_to_click,
        'start': page_from,
        'end': page_to,
      })

      if (page_to_click >= page_from && page_to_click <= page_to) {
        goto_and_start_click(search_res_page, page_to_click)
      } else {
        console.log("page to click " + page_to_click + " is outside [" + page_from, + ", " + page_to + "], stop clicking")
      }

    } else if (msg.command == "requestStatusUpdate") {
      // send back current page information
      if (page_to_click == -1) {

        chrome.storage.local.get({'progress': -2, "start": -1, "end": -1}, function (r2) {
          sendingPort.postMessage({
            command: "updateStatus",
            status: "dl: " + r2.progress + " ["+r2.start+','+r2.end+"]"
          })
        })
      } else {
        sendingPort.postMessage({
          command: "updateStatus",
          status: "Dl: " + page_to_click + " ["+page_from+','+page_to+"]"
        })
      }

    }

}
