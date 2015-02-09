var editor; //the ACE editor instance

var viewModes = ["CODE","RESULT","HYBRID"];
var currentViewMode;

var editorModes = ["HTML","JavaScript"];
var currentEditorMode;

var editorThemes = ["Chrome","Twilight"];
var currentEditorTheme;

var init = function(){
	_defineExtraFunctions();
	_changeViewMode(viewModes[0]);
	_adjustContentHeight();
	_initEditor();
	_initSettingsPanel();
	_loadEvents();
};

var _defineExtraFunctions = function(){
	//Extend JQuery functionality
	jQuery.fn.cssNumber = function(prop){
		var v = parseInt(this.css(prop),10);
		return isNaN(v) ? 0 : v;
	};
};

var _adjustContentHeight = function(){
	var wrapper_height = $("#content").height();
	var header_height = $("#editor_header").height();
	var max_height = wrapper_height-header_height;
	$("#editor, #preview").height(max_height);

	$("#settings_panel").height(max_height*0.95-$("#settings_panel").cssNumber("padding-right")*2);
	$("#settings_panel").css("top",40+max_height*0.025);
};

var _initEditor = function(){
	editor = ace.edit("editor");

	//Default values
    _changeEditorTheme("Chrome"); //It will trigger editor.setTheme("ace/theme/chrome");
    _changeEditorMode("JavaScript"); //It will trigger editor.getSession().setMode("ace/mode/javascript");
    document.getElementById('editor').style.fontSize='14px';
};

var _initSettingsPanel = function(){
	var fontsize = document.getElementById('editor').style.fontSize;
	fontsize = (fontsize.trim()=="" ? "12px" : fontsize);
	$("#settings_fontsize option[value='"+fontsize+"']").attr("selected","selected");

	$("#settings_mode option[value='"+currentEditorMode+"']").attr("selected","selected");
};

var _loadEvents = function(){
	window.onresize = function(event){
		_adjustContentHeight();
	};

	$("ul.menu > li[group='view']").click(function(){
		$("ul.menu li[group=view]").removeClass("active");
		$(this).addClass("active");
		_changeViewMode($(this).attr("viewMode"));
	});

	$("#settings").click(function(e){
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			$("#settings_panel").hide();
		} else {
			$(this).addClass("active");
			$("#settings_panel").show();
		}
	});

	$("#editorModeMenu").click(function(){
		$("#settings").trigger("click");
	});

	$("#closeSettingsButton").click(function(){
		$("#settings").removeClass("active");
		$("#settings_panel").hide();
	});

	$("#settings_fontsize").change(function(event) {
		var newFontsize = $(this).val();
		document.getElementById('editor').style.fontSize=newFontsize;
	});

	$("#settings_mode").change(function(event) {
		var newEditorMode = $(this).val();
		_changeEditorMode(newEditorMode);
	});

	$("#settings_theme").change(function(event) {
		var newTheme = $(this).val();
		_changeEditorTheme(newTheme);
	});

	$("#run").click(function(){
		_runCode();
	});
};

var _changeViewMode = function(viewMode){
	if((viewModes.indexOf(viewMode)!=-1)&&(viewMode!=currentViewMode)){
		for(var i in viewModes){
			if(viewMode === viewModes[i]){
				currentViewMode = viewMode;
				$("#editor, #preview").addClass(viewMode);
				$("ul.menu > li[group='view'][viewMode='"+viewMode+"']").addClass("active");
			} else {
				$("#editor, #preview").removeClass(viewModes[i]);
				$("ul.menu > li[group='view'][viewMode='"+viewModes[i]+"']").removeClass("active");
			}
		};
		if(typeof editor != "undefined"){
			editor.resize();
		}
	}
};

var _changeEditorMode = function(editorMode){
	if((editorModes.indexOf(editorMode)!=-1)&&(editorMode!=currentEditorMode)){
		currentEditorMode = editorMode;
		if(typeof editor != "undefined"){
			var aceMode;
			switch(editorMode){
				case "HTML":
					aceMode = "ace/mode/html";
					break;
				case "JavaScript":
					aceMode = "ace/mode/javascript";
					break;
				default:
					return;
			}
			if(typeof aceMode == "string"){
				editor.getSession().setMode(aceMode);
				$("#editorModeMenu").html(editorMode);
			}
		}
	}
};

var _changeEditorTheme = function(editorTheme){
	if((editorThemes.indexOf(editorTheme)!=-1)&&(editorTheme!=currentEditorTheme)){
		currentEditorTheme = editorTheme;
		if(typeof editor != "undefined"){
			var aceTheme;
			switch(editorTheme){
				case "Chrome":
					aceTheme = "ace/theme/chrome";
					break;
				case "Twilight":
					aceTheme = "ace/theme/twilight";
					break;
				default:
					return;
			}
			if(typeof aceTheme == "string"){
				editor.setTheme(aceTheme);
			}
		}
	}
};

var _runCode = function(){
	if(typeof editor == "undefined"){
		return;
	}

	_cleanPreview();
	var code = editor.getValue();

	if((typeof code != "string")||(code.trim()==="")){
		return;
	}

	if(currentViewMode === "CODE"){
		_changeViewMode("HYBRID");
	}

	switch(currentEditorMode){
		case "HTML":
			return runHTMLcode(code);
		case "JavaScript":
			return runJavaScriptcode(code);
		default:
			return;
	}
};

var _cleanPreview = function(){
	$("#preview").html("");
};

var runHTMLcode = function(HTMLcode){
	var iframe = $("<iframe class='iframe_code'></iframe>");
    $("#preview").append(iframe);

    doc = $("#preview").find("iframe").contents()[0];
           
    doc.open();
    doc.writeln(HTMLcode);
    doc.close();
};

var runJavaScriptcode = function(jscode){
	//The code should return the output in the result var.
	var evalReturnedValue = undefined;
	var result = undefined;
	var error = false;

	//1. Check if jscode returns some value with a return statement.
	try {
		jscode_wrappered = "var jsfunction = function(){\n" + jscode + "\n}; jsfunction;"
		result = eval(jscode_wrappered)();
	} catch(e1) {}

	//2. Check if the eval function stores any result in the 'result' var.
	if(typeof result == "undefined"){
		try {
			evalReturnedValue = eval(jscode);
		} catch (e2){
			result = "Error: " + e2.message;
			error = true;
		}
	}

	//3. Try to get the result directly from the code
	if(typeof result == "undefined"){
		result = evalReturnedValue;
	}
	
	if(typeof result == "undefined"){
		result = "No se encontró ningún resultado. Incluya una sentencia 'return' o almacene el resultado en una variable de nombre 'result'."
		error = true;
	}

	try {
		result = result.toString();
	} catch(e3){
		result = "Error: " + e3.message;
		error = true;
	}
	
	var wrapper = $("<div class='js_code'></div>");
	var container = wrapper;
	if(!error){
		$(wrapper).append("<pre></pre>");
		container = $(wrapper).find("pre");
	}
	$(container).html(result);

	$("#preview").append(wrapper);
};
