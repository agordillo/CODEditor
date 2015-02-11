CODEditor.UI = (function(C,$,undefined){

	var init = function(options){
		adjustView();
	};

	var adjustView = function(){
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
		// var glutterWidth = $("div.ace_layer.ace_gutter-layer.ace_folding-enabled").width();
	};

	var updateSettingsPanel = function(){
		var fontsize = document.getElementById('editor').style.fontSize;
		fontsize = (fontsize.trim()=="" ? "12px" : fontsize);
		$("#settings_fontsize option[value='"+fontsize+"']").attr("selected","selected");

		$("#settings_mode option[value='"+CODEditor.CORE.getCurrentEditorMode()+"']").attr("selected","selected");
	};

	var cleanPreview = function(){
		$("#preview").html("");
	};

	return {
		init 				: init,
		adjustView			: adjustView,
		updateSettingsPanel : updateSettingsPanel,
		cleanPreview		: cleanPreview
	};

}) (CODEditor,jQuery);