import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import propertiesPanelModule from 'bpmn-js-properties-panel';
import propertiesProviderModule from './provider/Station';
import magicModdleDescriptor from './descriptors/Station';
import CustomModeler from './custom-modeler';
import customElements from './custom-elements.json';
import {
  debounce
} from 'min-dash';

import diagramXML from '../resources/newDiagram.bpmn';


var container = $('#js-drop-zone');

var bpmnModeler =  new CustomModeler({

  container: '#canvas',
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    propertiesPanelModule,
    propertiesProviderModule
  ],
  moddleExtensions: {
    station: magicModdleDescriptor
  }
});

function createNewDiagram() {
  openDiagram(diagramXML);
}
var mappedNodes = {'bpmn2:definitions':'Root','bpmn2:task' : 'Stations','station:parameter':'RequestStructs'};
function openDiagram(xml) {

  bpmnModeler.importXML(xml, function(err) {
	   bpmnModeler.get('canvas').zoom('fit-viewport');


  
    if (err) {
      container
        .removeClass('with-diagram')
        .addClass('with-error');

      container.find('.error pre').text(err.message);

      console.error(err);
    } else {
      container
        .removeClass('with-error')
        .addClass('with-diagram');
    }


  });
}

function saveSVG(done) {
  bpmnModeler.saveSVG(done);
}
function capitalizeFirstLetter(item) {
	var item_ = item.split(":");
	if(item_.length == 2) {
		item= item_[1];
	}
    return item.charAt(0).toUpperCase() + item.slice(1);
}
var parentAttributs = {"IpAddress":"Device","ParamStrings":"Device","DeviceType":"Device"};
function xmlToJson(xml) {
	
	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
		
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				if("id" == attribute.nodeName) {
					continue;
				}
				var nodeName = capitalizeFirstLetter(attribute.nodeName.trim());
				if(parentAttributs[nodeName] == undefined) {
					obj[nodeName] = attribute.nodeValue.trim();
				}else {
					var parent = parentAttributs[nodeName];
				if(obj[parent] == undefined) {
					obj[parent]  = {};
				}
				obj[parent][nodeName] = attribute.nodeValue.trim();
				}
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if(nodeName == 'bpmndi:BPMNDiagram' || '#text' == nodeName) {
			continue;
			}
			if(mappedNodes[nodeName] != undefined) {
				nodeName = mappedNodes[nodeName];
			}
			
			if (typeof(obj[nodeName]) == "undefined") {
			    if(
				nodeName == 'Root' || 
				nodeName=='bpmn2:process' || 
				nodeName == 'bpmn2:subProcess') 
				    {
				    	obj = xmlToJson(item);
			     	}else {
				obj[nodeName] = xmlToJson(item);
				}
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
};


function saveDiagram(done) {

  bpmnModeler.saveXML({ format: true }, function(err, xml) {
    done(err, xml);
  });
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// bootstrap diagram functions

$(function() {

  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();

    createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');

  var downloadStations = $('#js-download-station');
  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(function() {

    saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });

    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
	 var  parser = new DOMParser();
	 var xmlDoc = parser.parseFromString(xml,"text/xml");
		var json = JSON.stringify(xmlToJson(xmlDoc),null,10);
		setEncoded(downloadStations, 'station.json', err ? null : json);
    });
  }, 500);

  setInterval(function(){
	      saveSVG(function(err, svg) {
      setEncoded(downloadSvgLink, 'diagram.svg', err ? null : svg);
    });

    saveDiagram(function(err, xml) {
      setEncoded(downloadLink, 'diagram.bpmn', err ? null : xml);
	 var  parser = new DOMParser();
	 var xmlDoc = parser.parseFromString(xml,"text/xml");
		var json = JSON.stringify(xmlToJson(xmlDoc),null,10);
		setEncoded(downloadStations, 'station.json', err ? null : json);
    });
  },500);
  bpmnModeler.on('commandStack.changed', exportArtifacts);
});


