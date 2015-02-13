CODEditor.UI = (function(C,$,undefined){

	var init = function(options){
		adjustView();
	};

	var adjustView = function(){
		//Adjust Heights
		var windowHeight = $(window).height();
		var headerHeight = $("#header").outerHeight();
		var contentHeight = windowHeight-headerHeight;

		var exerciseHeight = $("#exercise_wrapper").outerHeight();
		var wrappersHeight = contentHeight - exerciseHeight;
		$("#editor_wrapper, #preview_wrapper").height(wrappersHeight);

		var editorSubheaderHeight = $("#editor_header").outerHeight();
		var editorHeight = wrappersHeight - editorSubheaderHeight;
		$("#editor").height(editorHeight);

		var previewSubheaderHeight = $("#preview_header").outerHeight();
		var previewHeight = wrappersHeight - previewSubheaderHeight;
		$("#preview").height(previewHeight);

		//Adjust Settings
		$("#settings_panel").height(contentHeight*0.95-$("#settings_panel").cssNumber("padding-right")*2);
		$("#settings_panel").css("top",40+contentHeight*0.025);

		//More adjustments...
		// var glutterWidth = $("div.ace_layer.ace_gutter-layer.ace_folding-enabled").width();

		if(typeof CODEditor.CORE.getCurrentExercise() != "undefined"){
			$("ul.menu li[group='exercise']").css("display","inline-block");
		}

		//Adjust widhts in hybrid mode
		if(CODEditor.CORE.getCurrentViewMode()==="HYBRID"){
			var totalWidth = $("#content").outerWidth();
			var editorWrapperWidth = Math.floor(totalWidth/2);
			$("#editor_wrapper").width(editorWrapperWidth);
			var newEditorWrapperWidth = $("#editor_wrapper").outerWidth();
			var previewWrapperWidth = totalWidth - newEditorWrapperWidth - 0.5;
			$("#preview_wrapper").width(previewWrapperWidth);
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