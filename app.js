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
	_adjustView();
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

var _adjustView = function(){

	//Adjust Heights
	var window_height = $(window).height();
	var header_height = $("#header").height();
	var content_height = window_height-header_height;
	$("#editor_wrapper, #preview_wrapper").height(content_height);

	var subheadersHeight = $("#editor_header").height();
	var editorHeight = content_height - subheadersHeight;
	$("#editor, #preview").height(content_height);

	//Adjust Settings
	$("#settings_panel").height(content_height*0.95-$("#settings_panel").cssNumber("padding-right")*2);
	$("#settings_panel").css("top",40+content_height*0.025);

	//More adjustments...
	var glutterWidth = $("div.ace_layer.ace_gutter-layer.ace_folding-enabled").width();
};

var _initEditor = function(){
	editor = ace.edit("editor");

	//Default values
    _changeEditorTheme("Chrome"); //It will trigger editor.setTheme("ace/theme/chrome");
    _changeEditorMode("JavaScript"); //It will trigger editor.getSession().setMode("ace/mode/javascript");
    document.getElementById('editor').style.fontSize='14px';
    editor.setShowPrintMargin(false);
};

var _initSettingsPanel = function(){
	var fontsize = document.getElementById('editor').style.fontSize;
	fontsize = (fontsize.trim()=="" ? "12px" : fontsize);
	$("#settings_fontsize option[value='"+fontsize+"']").attr("selected","selected");

	$("#settings_mode option[value='"+currentEditorMode+"']").attr("selected","selected");
};

var _loadEvents = function(){
	window.onresize = function(event){
		_adjustView();
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
		var wrappersDOM = $("#editor_wrapper, #preview_wrapper");
		for(var i in viewModes){
			if(viewMode === viewModes[i]){
				currentViewMode = viewMode;
				$(wrappersDOM).addClass(viewMode);
				$("ul.menu > li[group='view'][viewMode='"+viewMode+"']").addClass("active");
			} else {
				$(wrappersDOM).removeClass(viewModes[i]);
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

		var wrappersDOM = $("#editor_wrapper, #preview_wrapper");
		$(wrappersDOM).addClass(currentEditorMode);

		$("#preview_wrapper #preview_header").html("");
		$("#preview_wrapper #preview").html("");

		for(var i in editorModes){
			if(editorMode === editorModes[i]){
				currentEditorMode = editorMode;
				$(wrappersDOM).addClass(editorMode);
				$("#editorModeMenu").html(editorMode);
			} else {
				$(wrappersDOM).removeClass(editorModes[i]);
			}
		};

		if(typeof editor != "undefined"){
			var aceMode;
			var initialValue = "";
			switch(editorMode){
				case "HTML":
					aceMode = "ace/mode/html";
					initialValue = "<html>\n\n</html>"
					$("#editor_tab p").html("index.html");
					break;
				case "JavaScript":
					aceMode = "ace/mode/javascript";
					$("#editor_tab p").html("script.js");
					$("#preview_wrapper.JavaScript #preview_header").html("<p>Consola</p>");
					break;
				default:
					return;
			}
			if(typeof aceMode == "string"){
				editor.getSession().setMode(aceMode);
				editor.setValue(initialValue);
			}
		}
	}
};

var _changeEditorTheme = function(editorTheme){
	if((editorThemes.indexOf(editorTheme)!=-1)&&(editorTheme!=currentEditorTheme)){

		$("body").removeAttr("theme");

		for(var i in editorThemes){
			if(editorTheme === editorThemes[i]){
				currentEditorTheme = editorTheme;
				$("body").attr("theme",editorTheme);
			}
		};

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

	/*if(_isCodeEmpty(code)){
		return;
	}*/

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

var _isCodeEmpty = function(code){
	if((typeof code != "string")||(code.trim()==="")){
		return true;
	}
	return false;
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
	var result;
	var evaluation = evalJavaScriptcode(jscode);

	console.log("evaluation")
	console.log(evaluation);

	var hasErrors = (evaluation.errors.length > 0);

	if(hasErrors){
		result = evaluation.errors.join("\n");
	} else {
		try {
			if(typeof evaluation.response === "undefined"){
				result = "undefined";
			} else {
				result = evaluation.response.toString();
			}
		} catch(e){
			result = "Error: " + e.message;
		}
	}

	var wrapper = $("<div class='js_code'></div>");
	var container = wrapper;
	if(hasErrors){
		$(wrapper).addClass("js_code_error");
	}
	$(wrapper).append("<pre></pre>");
	container = $(wrapper).find("pre");
	$(container).html(result);
	$("#preview").append(wrapper);
};

var evalJavaScriptcode = function(jscode){
	var evaluation = {};
	evaluation.errors = [];
	evaluation.response = undefined;

	//1. Check if jscode is a not empty string
	if(_isCodeEmpty(jscode)){
		evaluation.errors.push("No ha enviado ningún código para ser evaluado.");
		return evaluation;
	}

	var originalResultVar = "CODEAPP_" + Math.random()*Math.pow(10,10);
	var result = originalResultVar;
	var evalReturnedValue = undefined;

	try {
		evalReturnedValue = eval(jscode);

		//2. Check if the eval function stores any result in the 'result' var.
		if(result !== originalResultVar){
			evaluation.response = result;
			console.log("Result in Result Var");
			return evaluation;
		}

		//3. Try to get the result directly from the code.
		if(typeof evalReturnedValue !== "undefined"){
			evaluation.response = evalReturnedValue;
			console.log("Result directly fron code");
			return evaluation;
		}

	} catch (e1) {
		evalReturnedValue = undefined;

		//4. Check if jscode returns some value with a return statement.
		try {
			var jscode_wrappered = "var jsfunction = function(){\n" + jscode + "\n}; jsfunction;"
			evalReturnedValue = eval(jscode_wrappered)();
			//If a exception is triggered, it continues with the following steps.
			//If not, return result
			evaluation.response = evalReturnedValue;
			console.log("Result from return statement");
			return evaluation;
		} catch(e2) {
			//Return exception 1
			evaluation.errors.push("Error: " + e2.message);
			return evaluation;
		}
	}

	evaluation.errors.push("No se encontró ningún resultado.\nIncluya una sentencia 'return' o almacene el resultado en una variable de nombre 'result'.");
	return evaluation;
}; 
