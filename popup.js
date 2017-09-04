// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// use storage, after click one, remove from storage and when there is nothing in
// the storage, do nothing

// var url = "http://60.191.152.123:85/zk/search.aspx?key=A=杨洁[*]S=安徽医科大学"
// chrome.tabs.create({url: url})


document.addEventListener("DOMContentLoaded", documentEvents, false)


function documentEvents() {
  document.getElementById('ok_btn').addEventListener('click', function(){
      // read names
      var name = document.getElementById("name").value
      document.getElementById('status').textContent = name

      inst = "安徽医科大学"
      if (document.getElementById('ahmu').checked) {
        inst = "安徽医科大学"
      }

      if (document.getElementById('jfj').checked) {
        inst = "解放军"
      }

      // send data to the content_script for filling the search information
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          console.log("send fill command to active tab: " + name + " " + inst);
          chrome.tabs.sendMessage(tabs[0].id, {
            command: "fill",
            name: name,
            inst: inst})
      });
  }) // end ok_btn


  document.getElementById('click_btn').addEventListener('click', function(){
    document.getElementById('status').textContent = "start clicking"
    // send command to the content_script for filling the search information
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log("send click command to active tab");
        chrome.tabs.sendMessage(tabs[0].id, {command: "click"})
    });
  }) // end click_btn addEventListener

  document.getElementById('goto_btn').addEventListener('click', function(){
    var page_no = parseInt(document.getElementById("goto").value)
    if (isNaN(page_no)) {
      document.getElementById('status').textContent = "Invalid Page Number"
      return
    }
    document.getElementById('status').textContent = "Goto " + page_no
    // send command to the content_script for filling the search information
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log("send goto command to active tab, page_no: " + page_no);
        chrome.tabs.sendMessage(tabs[0].id, {command: "goto", pageno: page_no})
    });
  }) // end click_btn addEventListener


  var pageNavPortName = 'pageNav'
  var pageNavPort = chrome.runtime.connect({name: pageNavPortName})

  pageNavPort.onMessage.addListener(function(msg, sendingPort) {
    console.log("pageNavePort receive msg: " + JSON.stringify(msg))
    if (msg.command == "updateStatus") {
      document.getElementById('status').textContent = msg.status
    }

  })

  // every second tries to update the results
  setInterval(function() {
    pageNavPort.postMessage({
      command: 'requestStatusUpdate'
    })
  }, 1000)

  document.getElementById('pg_btn').addEventListener('click', function() {
    var page_from = parseInt(document.getElementById("pagefrom").value)
    var page_to = parseInt(document.getElementById("pageto").value)

    if (isNaN(page_from) || isNaN(page_to)) {
      document.getElementById('status').textContent = "Invalid Page Number"
      return
    }

    document.getElementById('status').textContent = " from " + page_from + " to " + page_to

    // find active chrome tab and send it over to pageNav with data
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tab_id = tabs[0].id
        console.log("find active tab: " + tab_id);
        pageNavPort.postMessage({
          command: "start",
          page_from: page_from,
          page_to: page_to,
          tab_id: tab_id
        })


    });


  }) // end pg_btn
}
