import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';
import StationMetaData from './StationMetadata.json';


import {
  is
} from 'bpmn-js/lib/util/ModelUtil';



function getUpdatedItem(id) {
var value = {"id":id};
	var row = document.getElementById(id);
	var tds = row.getElementsByTagName("td");
	value["name"] = tds[0].getElementsByTagName("input")[0].value;
	value["type"] = tds[1].getElementsByTagName("select")[0].value;
	
	return value;
}

function assignListener(element,id) {
var row = document.getElementById(id);
var tds = row.getElementsByTagName("td");
tds[0].getElementsByTagName("input")[0].addEventListener("blur",function() {
 paramHelpher.updateElement(element,getUpdatedItem(id));
});

tds[1].getElementsByTagName("select")[0].addEventListener("change",function() {
 paramHelpher.updateElement(element,getUpdatedItem(id));
});


}
function addNewParameter(element) {
var tbody = document.querySelector("#parameters tbody");
var id=create_UUID();
var html =tbody.innerHTML + "<tr id='" +id +  "'><td><input type='text'/></td><td><select><option></option><option>Load</option><option>Unload</option></select></td></tr>";
tbody.innerHTML = html;
 assignListener(element,id);
return {"type":"","id":id,"name":""};
}


function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
function findElementById(element,id) {
    var parameters = element.businessObject.extensionElements.get('values');
	var length = parameters.length;
	for(var i=0; i<length; i++) {
		if(parameters[i]["id"] == id) {
			return i;
		}
	}
	return null;
}
var bpmnFactory;
function fireEvent() {
	var evt = document.createEvent("HTMLEvents");
    evt.initEvent("change", false, true);
    document.querySelector("#camunda-name").dispatchEvent(evt);
}
var paramHelpher = {
	updateElement: function(element, value) {
		var index = findElementById(element,value["id"]);
		
		var parameter = element.businessObject.extensionElements.get('values')[index];
		parameter["name"] = value["name"];
		parameter["type"] = value["type"];
		fireEvent();
			
	},
    addElement: function(element, node,value) {
    	var parameter= bpmnFactory.create("station:Parameter");
		
		
		parameter["name"] = value["name"];
		parameter["type"] = value["type"];
		
		parameter["id"] = value["id"];
	if (!element.businessObject.extensionElements) {
			  
      element.businessObject.extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
    }
		
		element.businessObject.extensionElements.get('values').push(parameter);
	fireEvent();
    },

    removeElement: function(element, node, idx) {
      var bo = getSelected(element, node);
      return cmdHelper.removeElementsFromList(element, bo.definition, 'items', null, [ bo.definition.items[idx] ]);
    },
set: function(element, node) {
	
	var tbody = document.querySelector("#parameters tbody");
	var html = "";
	var options = ["","Load","Unload"];
	var ids = [];
	if (!element.businessObject.extensionElements) {
			  
      element.businessObject.extensionElements = bpmnFactory.create('bpmn:ExtensionElements');
    }
		
		
	element.businessObject.extensionElements.get('values').forEach((v)=>{
		if(v.$type == "station:Parameter") {
		html += "<tr id='" + v["id"] + "'><td><input type='text' placeholder='Name' value='" + encodeURIComponent(v["name"]) + "' /></td><td><select>";
		ids.push(v["id"]);
		var option = v["type"];
		options.forEach(op=>{
			html += "<option";
			if(op == option) {
			html += " selected>";
			}else {
				html += ">";
			}
			html += op + "</option>";
		});
		html += "</select></td></tr>";
		}	
	});
	
	tbody.innerHTML = html;
	ids.forEach(id=>{
	assignListener(element,id);
	});
}

};

entryFactory.paramFactory = function(options) {
return {id: "id",
html : "<div><button id='add'>+</button><br/><table id='parameters'><tbody></tbody></table></div>",
set: function(element,values,node) {
	paramHelpher.set(element,node);
},
get: function(element, node) {
	var node = document.getElementById("add");
	if(!node["added"]) {
	node.addEventListener("click", function(){
		paramHelpher.set(element,node);
  var value = addNewParameter(element);
  paramHelpher.addElement(element, node,value);
});
node["added"] = true;
	}
	
paramHelpher.set(element,node);
	var parameters = document.getElementById("parameters");
	var trs = document.querySelectorAll("#parameters tbody tr");
	var result = [];
	if(trs) {
	trs.forEach((tr)=>{
		var item = {};
		var tds =tr.querySelectorAll("td");
		item["name"] = tds[0].querySelector("input").value;
		item["type"] =tds[1].querySelector("select").value;
		
		item["id"] =tr["id"];
		result.push(item);
	});
	}
	return {"parameters":result};
}
}
}

export default function(group, element ,bpmnFactory_) {

  // Only return an entry, if the currently selected
  // element is a start event.
bpmnFactory=bpmnFactory_;
  if (is(element, 'bpmn:Task')) {
	   
  
    group.entries.push(entryFactory.paramFactory({}));
  for(var i in  StationMetaData) {
		  if(StationMetaData[i]["selectOptions"] == undefined) {
    group.entries.push(entryFactory.textField({
      id : StationMetaData[i].name,
      
      label :  StationMetaData[i].label,
      modelProperty :  StationMetaData[i].name
	}));
	}else {
	group.entries.push(entryFactory.selectBox({
      id : StationMetaData[i].name,
      selectOptions:StationMetaData[i]["selectOptions"],
      label :  StationMetaData[i].label,
	
      modelProperty :  StationMetaData[i].name
	}));
	}
	
	
    }
  }
}