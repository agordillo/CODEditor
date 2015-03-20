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
		$("#test_menu_wrapper p").html(currentTest.currentExerciseIndex.toString() + "/" + currentTest.exercisesQuantity.toString());
	};

	var updateTestMenuDialog = function(){
		var currentTest = C.CORE.getCurrentTest();
		var currentExercise = C.CORE.getCurrentExercise();

		var menuDOM = $("#test_exercises_dialog");
		$(menuDOM).html("");

		if(C.CORE.isEditorMode()){
			//Add "New Exercise" button
			var newExerciseButton = $('<div id="newExerciseButton" class="codeditor_button"><img src="img/glyphicons-433-plus.png"/> Crear nuevo ejercicio</div>');
			$(menuDOM).prepend(newExerciseButton);

			$("#newExerciseButton").click(function(){
				C.CORE.createExercise();
			});
		}

		var exercisesList = $("<ul></ul>");
		var exercisesLength = currentTest.parsed_exercises.length;
		for(var i=0; i<exercisesLength; i++){
			var exercise = currentTest.parsed_exercises[i];
			var exerciseIndex = (i+1);
			var li = $("<li exerciseIndex='" + exerciseIndex.toString() + "'></li>");
			var exerciseEntryViewerWrapper = $("<div class='exerciseEntryViewerWrapper'></div>");
			var exerciseProgressIconWrapper = $("<div class='exerciseProgressIcon'></div>");
			var exerciseIndexAndTitleWrapper = $("<div class='index_and_title_wrapper'></div>");
			var exerciseIndexSpan = $("<span class='exerciseIndex'>" + exerciseIndex.toString() + ". </span>");
			var exerciseTitleSpan = $("<span class='exerciseTitle'>" + exercise.title + "</span>");
			$(exerciseEntryViewerWrapper).append(exerciseProgressIconWrapper);
			$(exerciseIndexAndTitleWrapper).append(exerciseIndexSpan);
			$(exerciseIndexAndTitleWrapper).append(exerciseTitleSpan);
			$(exerciseEntryViewerWrapper).append(exerciseIndexAndTitleWrapper);
			$(li).append(exerciseEntryViewerWrapper);

			if(C.CORE.isEditorMode()){
				var exerciseEntryEditorWrapper = $("<div class='exerciseEntryEditorWrapper'></div>");
				if(exercisesLength > 1){
					var removeExerciseButton = $('<img src="img/glyphicons-17-bin.png" action="delete" title="Borrar ejercicio"/>');
					$(exerciseEntryEditorWrapper).append(removeExerciseButton);
				}
				$(li).append(exerciseEntryEditorWrapper);
			}
			
			if(exercise.progress.passed === true){
				$(li).addClass("passed");
				$(li).find(".exerciseProgressIcon").append("<img src='img/success_icon.png'/>");
			} else if(exerciseIndex===currentTest.currentExerciseIndex){
				// if(exercise===currentExercise)
				$(li).addClass("current");
				$(li).find(".exerciseProgressIcon").append("<span>></span>");
			}
			$(exercisesList).append(li);
		}
		$(menuDOM).append(exercisesList);

		//Reload events
		$("#test_exercises_dialog ul li").find(".exerciseEntryViewerWrapper").click(function(){
			var exerciseIndex = parseInt($(this).parents("li").attr("exerciseindex"));
			if((typeof exerciseIndex === "number")&&(!isNaN(exerciseIndex))){
				C.CORE.loadTestExercise(exerciseIndex);
				$("#test_exercises_dialog").dialog('close');
			}
		});

		if(C.CORE.isEditorMode()){
			$("#test_exercises_dialog ul li").find(".exerciseEntryEditorWrapper img[action]").click(function(){
				var exerciseIndex = parseInt($(this).parents("li").attr("exerciseindex"));
				switch($(this).attr("action")){
					case "delete":
						var r = confirm("¿Estás seguro de que deseas borrar este ejercicio?");
						if (r === true) {
							C.CORE.deleteExercise(exerciseIndex);
							updateUIAfterNewExerciseOnTest();
						}
						break;
					default:
						break;
				}
			});

			//Sortable
			$("#test_exercises_dialog ul").sortable({
				stop: function( event, ui ) {
					var oldExerciseIndex = parseInt($(ui.item).attr("exerciseindex"));
					
					var prevElement = $(ui.item).prev();
					var newExerciseIndex;
					if($(prevElement).length===0){
						newExerciseIndex = 1;
					} else {
						var prevExerciseIndex = parseInt($(prevElement).attr("exerciseindex"));
						if(oldExerciseIndex > prevExerciseIndex){
							newExerciseIndex = prevExerciseIndex + 1;
						} else if (oldExerciseIndex < prevExerciseIndex){
							newExerciseIndex = prevExerciseIndex;
						}
					}

					C.CORE.moveExercise(oldExerciseIndex,newExerciseIndex);
					C.UI.updateTestMenuDialog();
				}
			});
		}
		
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