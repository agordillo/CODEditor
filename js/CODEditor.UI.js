CODEditor.UI = (function(C,$,undefined){

	var init = function(options){
		if(CODEditor.CORE.isEditorMode()){
			$("ul.menu li.viewer:not(.editor)").css("display","none");
			$("#open").removeClass("first");
			$("#openurl").addClass("last");
			$("title").html("CODEditor");
		} else {
			$("ul.menu li.editor:not(.viewer)").css("display","none");
			$("title").html("CODEditor: Viewer");
		}
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

		//Adjust Panels (Settings, Examples, ...)
		$(".cpanel").height(contentHeight*0.95-$(".cpanel").cssNumber("padding-right")*2);
		$(".cpanel").css("top",40+contentHeight*0.025);

		//More adjustments...
		// var glutterWidth = $("div.ace_layer.ace_gutter-layer.ace_folding-enabled").width();

		//Adjust widhts in hybrid mode
		if(C.CORE.getCurrentViewMode()==="HYBRID"){
			var totalWidth = $("#content").outerWidth();
			var editorWrapperWidth = Math.floor(totalWidth/2);
			$("#editor_wrapper").width(editorWrapperWidth);
			var newEditorWrapperWidth = $("#editor_wrapper").outerWidth();
			var previewWrapperWidth = totalWidth - newEditorWrapperWidth - 0.5;
			$("#preview_wrapper").width(previewWrapperWidth);
		}

		if ($("#test_header").is(":visible")){
			$("#test_header").width($("#content").outerWidth() - $("#test_header").cssNumber("padding-right") - $("#test_header").cssNumber("padding-left"));
		}

		var editor = C.CORE.getEditor();
		if(typeof editor !== "undefined"){
			editor.resize();
		};
	};

	var updateSettingsPanel = function(){
		var fontsize = document.getElementById('editor').style.fontSize;
		fontsize = (fontsize.trim()=="" ? "12px" : fontsize);
		$("#settings_fontsize option[value='"+fontsize+"']").attr("selected","selected");

		$("#settings_mode option[value='"+C.CORE.getCurrentEditorMode()+"']").attr("selected","selected");
	};

	var cleanPreview = function(){
		$("#preview").html("");
	};

	var updateUIAfterNewExerciseOnTest = function(){
		var currentTest = C.CORE.getCurrentTest();

		var testMenuWrapper = ("#test_menu_wrapper");
		$(testMenuWrapper).find("p").html(currentTest.currentExerciseIndex.toString() + "/" + currentTest.exercisesQuantity.toString());
	};

	var updateTestMenuDialog = function(){
		var currentTest = C.CORE.getCurrentTest();
		var currentExercise = C.CORE.getCurrentExercise();

		var menuDOM = $("#test_exercises_dialog");
		$(menuDOM).html("");

		var exercisesList = $("<ul></ul>");
		for(var i=0; i<currentTest.parsed_exercises.length; i++){
			var exercise = currentTest.parsed_exercises[i];
			var exerciseIndex = (i+1);
			var li = $("<li exerciseIndex='" + exerciseIndex.toString() + "'><div class='exerciseProgressIcon'></div><span class='exerciseIndex'>" + exerciseIndex.toString() + ".</span> " + exercise.title + "</li>");
			if(exercise.progress.passed === true){
				$(li).addClass("passed");
				$(li).find(".exerciseProgressIcon").append("<img src='img/success_icon.png'/>");
			// } else if(exercise===currentExercise){
			} else if(exerciseIndex===currentTest.currentExerciseIndex){
				$(li).addClass("current");
				$(li).find(".exerciseProgressIcon").append("<span>></span>");
			}
			$(exercisesList).append(li);
		}
		$(menuDOM).append(exercisesList);

		//Reload events
		$("#test_exercises_dialog ul li").click(function(){
			var exerciseIndex = parseInt($(this).attr("exerciseindex"));
			if((typeof exerciseIndex === "number")&&(!isNaN(exerciseIndex))){
				C.CORE.loadTestExercise(exerciseIndex);
				$("#test_exercises_dialog").dialog('close');
			}
		});
	};


	return {
		init 							: init,
		adjustView						: adjustView,
		updateSettingsPanel 			: updateSettingsPanel,
		cleanPreview					: cleanPreview,
		updateUIAfterNewExerciseOnTest	: updateUIAfterNewExerciseOnTest,
		updateTestMenuDialog			: updateTestMenuDialog
	};

}) (CODEditor,jQuery);