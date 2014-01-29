System.Gadget.settingsUI = "cgsettings.html";
System.Gadget.onSettingsClosed = SettingsClosed;

var gadgetpath = System.Gadget.path;
var inputFile = gadgetpath + "\\input.txt";
var dataFile = gadgetpath + "\\data.txt";
var mainPage = "http://coinmarketcap.com/";
var count = 0;
var refreshInt = "10";
var currs;
var data;
var sets;

if (System.Gadget.Settings.read("RefreshInterval") != "" && 
    System.Gadget.Settings.read("Currencies") != "") 
{
    refreshInt = System.Gadget.Settings.readString("RefreshInterval");
    currs = System.Gadget.Settings.readString("Currencies");
}

function init() {
  fillSets();
  
  if (System.Gadget.Settings.read("RefreshInterval") == "" || 
      System.Gadget.Settings.read("Currencies") == "") 
  {
    System.Gadget.Settings.writeString("RefreshInterval", sets[0][0]);
    refreshInt = sets[0][0];
    
    currs = getCurrText();
    System.Gadget.Settings.writeString("Currencies", currs);
  }
  
  getData();
  setInterval(function () { updateTick(); }, 60000);
}

function getData() {
  try
  { 
    var result = httpGet(mainPage);
    
    if (result != "")
    {
      var cutResult = cut(result, "<tbody>", "</tbody>");
      var res = cutResult.split("</tr>");
      
      data = [];
      data = new Array(res.length - 1);
      for (var i = 0; i < res.length - 1; i++) {
        data[i] = new Array(4);
      }
      
      for (var i = 0; i < res.length - 1; i++) {
        // name
        var t1 = cutStart(res[i], "id=\"");
        var t2 = cutEnd(t1, "\"");
        
        if (t2 != "")
        {
          data[i][1] = t2.toUpperCase();
          
          var main1 = cutStart(res[i], "currency-name");
          var main2 = cutEnd(main1, "</td>");
          
          // image
          var t3 = cutStart(main2, "src=\"");
          var t4 = cutEnd(t3, "\"");
          data[i][0] = mainPage + t4;
          
          // convert rate
          var t5 = cutStart(res[i], "class=\"price\" data-usd=\"");
          var t6 = cutEnd(t5, "\"");
          data[i][2] = t6;
          
          // convert link
          data[i][3] = mainPage + t2 + "_30.html";
        }
        else
          break;      
      }
    
      var fs = new ActiveXObject("Scripting.FileSystemObject");
    	var newFile = fs.CreateTextFile(inputFile);
    	try
    	{
        for (var i = 0; i < data.length; i++) {
    		  newFile.WriteLine(data[i][0] + ";" + data[i][1] + ";"
            + data[i][2] + ";" + data[i][3]);
        }
    	}
    	finally
    	{
    		newFile.Close();
    	}
    }
    else
    {
      fillInput();  
    }
  }
  catch(e)
  {
    fillInput();    
  }
  
  reloadPage();  
}

function reloadPage() {
  var totalFunds = 0;
  var countCurr = 0;
  
  for (var i = sets.length - 1; i >= 1; i--) {
    for (var j = 0; j < data.length; j++)
    {
      if (sets[i][0].toUpperCase() == data[j][1].toUpperCase())
      {
        countCurr++;
      
        if (data[j][2] != "" && data[j][2] != "?")
        {
          totalFunds = totalFunds 
            + (parseFloat(data[j][2]))*(parseFloat(sets[i][1]));
        }      
      }
    }
  }

  var height = 22 * countCurr + 36;
  document.getElementById("main").style.height = height.toString() + "px"; 

  var intFunds = Math.round(totalFunds);
  var table = document.getElementById("table");
  
  for(var i = table.rows.length - 1; i >= 0; i--)
  {
      table.deleteRow(i);
  }
  
  var row = table.insertRow(0);
  var cell0 = row.insertCell(0);
  var cell1 = row.insertCell(1);
  var cell2 = row.insertCell(2);
  
  cell0.innerHTML = "<div style=\"height: 32px;\"></div>";
  cell1.innerHTML = "<div style=\"font-size: 10px;\">TOTAL $:</div>";
  cell2.innerHTML = intFunds.toString();
  
  for (var i = sets.length - 1; i >= 1; i--) {
    for (var j = 0; j < data.length; j++)
    {
      if (sets[i][0].toUpperCase() == data[j][1].toUpperCase())
      {
        var row = table.insertRow(0);
        var cell0 = row.insertCell(0);
        var cell1 = row.insertCell(1);
        var cell2 = row.insertCell(2);
        
        cell0.innerHTML = "<img src=\"" + data[j][0] 
          + "\" alt=\"" + data[j][1] + "\" />&nbsp";
        
        if (data[j][2].length <= 6)
        {  
          cell1.innerHTML = "<a href=\"" + data[j][3] 
            + "\" style=\"width: 55px;\">" + data[j][2] + "$</a>";
        }
        else
        {
          cell1.innerHTML = "<a href=\"" + data[j][3] 
            + "\" style=\"width: 55px;\">" + data[j][2] + "</a>";  
        }
          
        cell2.innerHTML = "<input id=\"" + data[j][1].toLowerCase()
          + "\" class=\"inputs\" type=\"text\" value=\"" + sets[i][1]
          + "\" onchange=\"changedInput()\" />"; 
      }              
    }  
  }
}

function changedInput()
{
  for(var i = 1; i < sets.length; i++)
  {
    var element = document.getElementById(sets[i][0].toLowerCase());
    sets[i][1] = element.value;    
  }
  
  saveToFile(sets);
  reloadPage();
}

function fillInput()
{
  var fi = new ActiveXObject("Scripting.FileSystemObject");
  var file = fi.GetFile(inputFile);
  var allData = file.OpenAsTextStream(1);
  var lineCount = 0;
  
  while (!allData.AtEndOfStream)
  {
    var line = allData.ReadLine();
    lineCount++;
  }
  
  data = [];
  data = new Array(lineCount);
  for (var i = 0; i < lineCount; i++) {
    data[i] = new Array(4);
  }
  
  var inData = file.OpenAsTextStream(1);
  var lc = 0;
  while (!inData.AtEndOfStream)
  {
    var line = inData.ReadLine();
    data[lc] = line.split(";");
    lc++;
  }  
}

function fillSets()
{
  var fs = new ActiveXObject("Scripting.FileSystemObject");
  var fileSet = fs.GetFile(dataFile);
  var setsData = fileSet.OpenAsTextStream(1);
  var lineCount = 0;
  
  while (!setsData.AtEndOfStream)
  {
    var line = setsData.ReadLine();
    lineCount++;
  }
  
  sets = [];
  sets = new Array(lineCount);
  for (var i = 0; i < lineCount; i++) {
    sets[i] = new Array(2);
  }
  
  var sData = fileSet.OpenAsTextStream(1);
  var lc = 0;
  while (!sData.AtEndOfStream)
  {
    var line = sData.ReadLine();
    sets[lc] = line.split(";");
    lc++;
  }  
}

function getCurrText()
{
  var result = "";
   
  for (var i = 1; i < sets.length; i++) {
    result += sets[i][0] + ";"
  }
  
  return result;  
}

function httpGet(theUrl)
{
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl + makeId(), false);
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function makeId()
{
    var text = "";
    var poss = "abcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 16; i++ )
        text += poss.charAt(Math.floor(Math.random() * poss.length));

    return text;
}

function updateTick() {
    count++;
    
    if (count >= parseInt(refreshInt)) {
        getData();
        count = 0;
    }
}

function SettingsClosed(event) {
  if (event.closeAction == event.Action.commit) {
      refreshInt = System.Gadget.Settings.readString("RefreshInterval");
      currs = System.Gadget.Settings.readString("Currencies");
      
      try
      {
        var test = parseInt(refreshInt);
        if (test == 0) 
        {
          refreshInt = "10";
        }    
      }
      catch(e)
      {
        refreshInt = "10";  
      }
      
      saveNewSettings();
      fillSets();
      reloadPage();
  }
  event.cancel = false;
}

function saveNewSettings()
{
  var newCurrs = currs.split(";");
  var size = 0;
  var ok = false;
  
  for(var i = 0; i < newCurrs.length; i++)
  {
    ok = false;
    for(var j = 1; j < sets.length; j++)
    {
      if (newCurrs[i] == sets[j][0])
      {
        size++;
        ok = true;  
      }
    }
    
    if(!ok)
    {
      for(var j = 0; j < data.length; j++)
      {
        if (newCurrs[i] == data[j][1])
        {
          size++;  
        }
      }  
    }
  }
  
  if (size == 0) {
    size = 1;
  }
  
  var newSets = new Array(size + 1);
  for (var i = 0; i < size + 1; i++) {
    newSets[i] = new Array(2);
  }
  
  newSets[0][0] = refreshInt;
  size = 1;
  for(var i = 0; i < newCurrs.length; i++)
  {
    ok = false;
    for(var j = 1; j < sets.length; j++)
    {
      if (newCurrs[i] == sets[j][0])
      {
        newSets[size][0] = sets[j][0];
        newSets[size][1] = sets[j][1];
        size++;
        ok = true;  
      }
    }
    
    if(!ok)
    {
      for(var j = 0; j < data.length; j++)
      {
        if (newCurrs[i] == data[j][1])
        {
          newSets[size][0] = data[j][1];
          newSets[size][1] = "0";
          size++;  
        }
      }  
    }
  }
  
  if (size == 1) {
    newSets[1][0] = "BTC";
    newSets[1][1] = "0";
  }

  saveToFile(newSets);    
}

function saveToFile(arraySets)
{
  var fd = new ActiveXObject("Scripting.FileSystemObject");
	var newFile = fd.CreateTextFile(dataFile);
	try
	{
    newFile.WriteLine(arraySets[0][0]);
    for (var i = 1; i < arraySets.length; i++) {
		  newFile.WriteLine(arraySets[i][0] + ";" + arraySets[i][1]);
    }
	}
	finally
	{
		newFile.Close();
	}  
}

function cut(str, startString, endString){
  var cutStart = str.indexOf(startString) + startString.length;
  var cutEnd = str.indexOf(endString);
  return str.substr(cutStart, cutEnd - cutStart);
}

function cutStart(str, startString){
  var cutStart = str.indexOf(startString) + startString.length;
  return str.substr(cutStart);
}

function cutEnd(str, endString){
  var cutEnd = str.indexOf(endString);
  return str.substr(0, cutEnd);
}