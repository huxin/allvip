console.log("Running persistently content_script")


$(document).arrive('.title.btnTitle', function() {
    // 'this' refers to the newly created element
    console.log("search result is ready! can do something")
    console.log(this)
});


$(document).arrive('#dowlUrlUL', function() {
    // 'this' refers to the newly created element
    console.log("\tdownload details is ready, start downloading:")
    var as = $(this).find('a')
    if (as != null && as.length > 0) {
      console.log("\tTotal download link: " + as.length + ' click first a')
      as[0].click()
    }
});

url = document.URL


var paper_links = []
var click_idx = 0
var paper_click_interval = null
var pageNavPortName = 'pageNav'
var pageNavPort =  chrome.runtime.connect({name: pageNavPortName})

// listens for command directly sent to the page
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log('receive request: ' + JSON.stringify(request))
    var command = request.command
    var name = request.name
    var inst = request.inst


    switch (command) {
      case "fill":
          console.log("do fill Change institution to " + inst)
          document.getElementById('queryBox').value = inst
          document.getElementById('searchButton').click()
          break // fill

      case "goto":
          // goto command, needs to make sure it's the right year
          var goto_page_no = request.pageno
          console.log("Recived goto command, goto page: " + goto_page_no)
          gotoPageFunc(goto_page_no)
          break // goto

      case "click":
          click_idx = 0
          paper_links = $('.btnTitle.btnIsView')
          console.log("Found: " + paper_links.length + " links start downloading")
          clickfunc()
          paper_click_interval = setInterval(clickfunc, 12000)
          break // click

      case "clear":
          break // clear
    } // end switch

  }) // end add listener for command message

var getCurPageFunc = function () {
  return parseInt($('.page-num a.current').text())
}

var gotoPageFunc = function(page_no) {
  var pg_num_as =  $('.page-num a')
  if (pg_num_as.length == 0) {
    prompt("Cannot find page number element to jump to: " + page_no)
  }
  console.log("goto page: " + page_no)
  pg_num_as[0].href = "javascript:void(g_GetGotoPage('" + page_no + "'))"
  pg_num_as[0].click()
}


var clickfunc = function () {
      if (paper_links.length === 0) {
          console.log("no paper links, skip")
          return
      } else if (click_idx >= paper_links.length) {
     // } else if (click_idx >= 2) {
          var curPage = getCurPageFunc()
          console.log('finished click everything stop, send curPage to plugin: ' + curPage)
          click_idx = 0
          paper_links = []

          // send finish signal to background
          pageNavPort.postMessage({
              command: 'finish',
              page_no: curPage
          })
          clearInterval(paper_click_interval)
          return
      } // end else if

    link = paper_links[click_idx]

    console.log("Click " + click_idx + "th link")
    click_idx ++
    if (typeof closedown === "function") {
      console.log('Calling closeDown function!')
      closedown()
    }
    link.click()
} // end clickfunc
