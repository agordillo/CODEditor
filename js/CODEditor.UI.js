CODEditor.UI = (function(C,$,undefined){

	var init = function(options){
		adjustView();
	};

	var adjustView = function(){
		//Adjust Heights
		var windowHeight = $(window).height();
		var headerHeight = $("#header").height();
		var contentHeight = windowHeight-headerHeight;

		var exerciseHeight = $("#exercise_wrapper").height()+$("#exercise_wrapper").cssNumber("padding-top")+$("#exercise_wrapper").cssNumber("padding-bottom");
		var editorWrapperHeight = contentHeight - exerciseHeight;
		$("#editor_wrapper, #preview_wrapper").height(editorWrapperHeight);

		var subheadersHeight = $("#editor_header").height();
		var editorHeight = editorWrapperHeight - subheadersHeight;
		$("#editor, #preview").height(editorHeight);

		//Adjust Settings
		$("#settings_panel").height(contentHeight*0.95-$("#settings_panel").cssNumber("padding-right")*2);
		$("#settings_panel").css("top",40+contentHeight*0.025);

		//More adjustments...
		// var glutterWidth = $("div.ace_layer.ace_gutter-layer.ace_folding-enabled").width();

		if(typeof CODEditor.CORE.getCurrentExercise() != "undefined"){
			$("ul.menu li[group='exercise']").css("display","inline-block");
		}

		var editor = CODEditor.CORE.getEditor();
		if(typeof editor !== "undefined"){
			editor.resize();
		};
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