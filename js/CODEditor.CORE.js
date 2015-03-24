CODEditor.CORE = (function(C,$,undefined){

	//Initial options
	var _options;
	var _isViewer = false; //If CODEditor is in viewer mode, or editor mode.


	var _editor; //ACE editor instance

	var _viewModes = ["CODE","RESULT","HYBRID","SCORE"];
	var _currentViewMode;
	var _isScore = false;

	var _editorModes = ["HTML","JavaScript"];
	var _currentEditorMode;
	var _currentPreviewMode;

	var defaultValues = {};
	defaultValues["HTML"] = "<html>\n  <head>\n  </head>\n  <body>\n    \n  </body>\n</html>";
	defaultValues["JavaScript"] = "";
	defaultValues["SCORE"] = {};
	defaultValues["SCORE"]["HTML"] = '/*\nvar score = function(document){\n  var grade = {};\n  grade.successes = [];\n  grade.errors = [];\n  grade.feedback = [];\n\n  grade.score = 10;\n  grade.successes.push("Correcto.");\n\n  return grade;\n};\n*/';
	defaultValues["SCORE"]["JavaScript"] = '/*\nvar score = function(result,variablesHash){\n  var grade = {};\n  grade.successes = [];\n  grade.errors = [];\n  grade.feedback = [];\n\n  grade.score = 10;\n  grade.successes.push("Correcto.");\n\n  return grade;\n};\n*/';

	var _editorThemes = ["Chrome","Twilight"];
	var _currentEditorTheme;

	var _currentTest;
	var _currentExercise;
	var _currentExerciseIndex;

	var _isDefaultMode = false;

	var _currentLSKey;

	var _lastSavedResource;

	var _examples = {};

	var _currentUser;

	//Enable debugging
	var _debug = false;

	_initOptions = {};
	_URLparams = {};


	var init = function(options){
		C.I18n.init();

		if(typeof options !== "object") {
			options = {};
		}

		_initOptions = options;

		if(typeof options.viewer == "boolean") {
			_isViewer = options.viewer;
		}

		if(isEditorMode()){
			$("body").addClass("editor");
		}else{
			$("body").addClass("viewer");
		}

		_URLparams = C.Utils.readURLparams();

		if(_URLparams["debug"] === "true"){
			_debug = true;
		}

		C.Utils.init();
		C.FullScreen.init();
		C.Score.init();

		//Default view mode (CODE)
		_changeViewMode(_viewModes[0]);

		C.UI.init();
		_initACEEditor();
		C.UI.updateSettingsPanel();

		_loadEvents();

		C.JS.init();
		C.HTML.init();

		if(isEditorMode()){
			_initEditor();
		}

		_populateExamples();
		_populateAbout();

		if(typeof _URLparams["file"] === "string"){
			_onGetExternalJSONFile(_URLparams["file"],{initExerciseMode: true});
		} else if(typeof options.file == "object") {
			if(_isValidJSON(options.file)){
				_initExerciseMode(options.file);
			} else {
				C.Utils.showDialog(C.I18n.getTrans("i.invalidResourceToLoad"));
				_initDefaultMode();
			}
		} else {
			if((_debug)&&(typeof _URLparams["example"] === "string")){
				_initExerciseMode(C.Samples.getExample(_URLparams["example"]));
			} else {
				_initDefaultMode();
			}
		}
	};

	var _onGetExternalJSONFile = function(fileURL,options){
		if(typeof options != "object"){
			options = {};
		}

		if((typeof fileURL !== "string")||(fileURL.trim() === "")){
			return C.Utils.showDialog(C.I18n.getTrans("i.invalidResourceURL"));
		}

		//Allow to include default ViSH URLs for JSON files uploaded to http://vishub.org.
		var vishDocMatching = fileURL.match(/^http:\/\/vishub.org\/documents\/[0-9]+$/);
		if((vishDocMatching instanceof Array)&&(vishDocMatching.length === 1)){
			fileURL = vishDocMatching[0] + ".txt";
		}

		_getExternalJSONFile(fileURL,function(json){
			//On success
			if(_isValidJSON(json)){
				if(isViewerMode()){
					if(options.initExerciseMode===true){
						_initExerciseMode(json);
					} else {
						_loadJSON(json);
					}
				} else {
					_currentLSKey = undefined;
					_initExerciseMode(json);
				}
			} else {
				C.Utils.showDialog(C.I18n.getTrans("i.invalidResourceToLoad"));
				_initDefaultMode();
			}
		}, function(jqXHR,textStatus,errorThrown){
			//On failure
			C.Utils.showDialog(C.I18n.getTrans("i.errorLoadingResourceURL",{url: fileURL}));
			__URLparams();
		});
	};

	//Init CODeditor when no excercise is loaded
	var _initDefaultMode = function(){
		_isDefaultMode = true;

		if(isViewerMode()){
			if(typeof _URLparams["emode"] === "string"){
				_changeEditorMode(_URLparams["emode"]);
			}

			C.SCORM.init();
		}
	};

	var _initEditor = function(){
		var exerciseDOM = $("#exercise_wrapper");
		$(exerciseDOM).addClass("open");

		//Title
		var exerciseTitleDOM = $("#exercise_title");
		var exerciseTitleInput = $('<input id="exerciseTitleInput" placeholder="' + CODEditor.I18n.getTrans("i.exerciseTitle") + '" type="text"/>');
		$(exerciseTitleDOM).append(exerciseTitleInput);

		//Description
		$("#exercise_description").show();
		var exerciseDescriptionTextArea = $('<textarea id="exerciseDescriptionTextArea" placeholder="' + CODEditor.I18n.getTrans("i.description") + '"></textarea>');
		$("#exercise_description").append(exerciseDescriptionTextArea);

		//Test
		var testWrapper = $("#test_menu_wrapper");

		//Test: Title
		var testTitleInput = $('<input id="testTitleInput" placeholder="' + C.I18n.getTrans("i.testTitle") + '" type="text"/>');
		$(testTitleInput).insertBefore("#test_title");
		$("#test_title").remove();

		$("#testTitleInput").keydown(function(){
			$(this).css("width",_getWidthOfTestTitleInput()+"px");
		});

		C.UI.adjustView();
	};

	var _getWidthOfTestTitleInput = function(){
		var input = $("#testTitleInput")[0];
		var tmp = document.createElement("span");
		tmp.className = "span-tmp-element";
		tmp.innerHTML = input.value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
		document.body.appendChild(tmp);
		var theWidth = tmp.getBoundingClientRect().width;
		document.body.removeChild(tmp);
		return theWidth;
    }

	var _initExerciseMode = function(json){
		_isDefaultMode = false;

		_loadJSON(json);

		if(isViewerMode()){
			$("ul.menu li[group*='examples']").css("display","none"); //Hide examples
			C.SCORM.init();
		} else {
			C.UI.loadMetadata();
		}
	};

	var _populateExamples = function(){
		var allExamples = C.Samples.getExamples();
		var selector = $("#examples_panel #examples_selection");

		for(var i=0; i<allExamples.length; i++){
			var example = allExamples[i];
			var eEditorMode;
			var eTitle;

			if(example.type==="test"){
				var eEditorModeArray = [];
				var testExercises = JSON.parse(example.exercises);
				//Infer editorMode
				for(var j=0; j<testExercises.length; j++){
					var testExercise = testExercises[j];
					if(eEditorModeArray.indexOf(testExercise.editorMode)===-1){
						eEditorModeArray.push(testExercise.editorMode);
					}
				}
				eEditorMode = eEditorModeArray.join(" ");
				eTitle = example.title + " (Test)";
			} else {
				//exercise
				eEditorMode = example.editorMode;
				eTitle = example.title;
			}

			$(selector).append('<option group="'+ eEditorMode + '" value="'+ i.toString() +'">' + eTitle + '</option>');
			_examples[i] = example;
		}
	};

	var _populateAbout = function(){
		$("#about_codeditor_version span").html("CODEditor v" + CODEditor.VERSION);
	};

	var _loadExamples = function(editorMode){
		if(_editorModes.indexOf(editorMode)===-1){
			editorMode = _currentEditorMode;
		}
		$("#examples_panel #examples_selection option").removeAttr("selected").hide();
		$("#examples_panel #examples_selection option[group*='" + editorMode + "']").show();
		$($("#examples_panel #examples_selection option[group*='" + editorMode + "']")[0]).attr("selected","selected");
	};

	var _loadFSFiles = function(){
		$("#lsfiles_select").html("");

		if(CODEditor.Utils.isLocalStorageSupported()){
			var lsKeysLength = localStorage.length;
			for (var i = 0; i < lsKeysLength; i++){
				try {
					var key = localStorage.key(i);
					var record = JSON.parse(localStorage.getItem(key));
					var resource = record.resource;
					var recordTitle = C.I18n.getTrans("i.untitled") + " (" + C.I18n.getTrans("i.savedAt",{date: C.Utils.getReadableDate(record.saved_at)}) + ")";
					if((typeof resource.title == "string")&&(resource.title.trim()!=="")){
						recordTitle = resource.title;
					}
					if(_isValidJSON(resource)){
						var option = $('<option value="'+ key +'">'+ recordTitle + '</option>');
						if(_currentLSKey===key){
							$(option).attr("selected","selected");
						}
						$("#lsfiles_select").prepend(option);
					}
				} catch (e){}
			}
		}

		if($("#lsfiles_select").children().length===0){
			$("#lsfiles_panel .codeditor_button[action]").addClass("disabled");
			$("#lsfiles_select").attr("disabled","disabled");
		} else {
			$("#lsfiles_panel .codeditor_button[action]").removeClass("disabled");
			$("#lsfiles_select").removeAttr("disabled");
		}
	};

	var getCurrentViewMode = function(){
		return _currentViewMode;
	};

	var getCurrentEditorMode = function(){
		return _currentEditorMode;
	};

	var getCurrentEditorTheme = function(){
		return _currentEditorTheme;
	};

	var getEditor = function(){
		return _editor;
	};

	var getCurrentTest = function(){
		return _currentTest;
	};

	var getCurrentExercise = function(){
		return _currentExercise;
	};

	var getCurrentExerciseIndex = function(){
		return _currentExerciseIndex;
	};

	var _initACEEditor = function(options){
		_editor = ace.edit("editor");

		_editor.$blockScrolling = Infinity;

		//Specify Default values
		_changeEditorMode(_editorModes[1]);
		_changeEditorTheme(_editorThemes[0]);

		document.getElementById('editor').style.fontSize='14px';
		_editor.setShowPrintMargin(false);

		_editor.getSession().setTabSize(2);

		//Alternative commands
		_editor.commands.addCommand({
			name: 'alternativeToggleBlockComment',
			bindKey: {win: 'Ctrl-Shift-J',  mac: 'Command-Shift-J'},
			exec: function(editor) {
				editor.toggleBlockComment();
			}
		});

		_editor.commands.addCommand({
			name: 'alternativeToggleLinesComment',
			bindKey: {win: 'Ctrl-J',  mac: 'Command-J'},
			exec: function(editor) {
				editor.toggleCommentLines();
			}
		});

		_focusEditor();
	};

	var _focusEditor = function(){
		if(typeof _editor !== "undefined"){
			_editor.focus();
			var _editorSession = _editor.getSession();
			//Get the number of lines
			var _count = _editorSession.getLength();
			//Go to end of the last line
			_editor.gotoLine(_count, _editorSession.getLine(_count-1).length);
		}
	};

	var _loadEvents = function(){
		window.onresize = function(event){
			C.UI.adjustView();
			if(typeof _currentExercise !== "undefined"){
				if(_currentExercise.editorMode === "HTML"){
					C.HTML.adjustHTMLPreviewUI();
				}
			}
			if(isEditorMode()){
				if($(".preview_iframe").dialog("isOpen")){
					_resizePreviewDialog($(".preview_iframe"));
				}
			}
		};

		window.onbeforeunload = function(){
			if(isViewerMode()){
				if(C.SCORM.isConnected()){
					C.SCORM.onExit();
				}
			} else {
				//Editor mode
				if(_hasResourceChanged()){
					return C.I18n.getTrans("i.exitConfirmation");
				}
			}
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
				C.Utils.closePanels();
				$(this).addClass("active");
				$("#settings_panel").show();
			}
		});

		$("#examples").click(function(e){
			if($(this).hasClass("active")){
				$(this).removeClass("active");
				$("#examples_panel").hide();
			} else {
				C.Utils.closePanels();
				$("#examples_panel #examples_mode option[value='"+C.CORE.getCurrentEditorMode()+"']").attr("selected","selected");
				_loadExamples();
				$(this).addClass("active");
				$("#examples_panel").show();
			}
		});

		$("#editorModeMenu").click(function(){
			$("#settings").trigger("click");
		});

		$("#settings_fontsize").change(function(event) {
			var newFontsize = $(this).val();
			document.getElementById('editor').style.fontSize=newFontsize;
		});

		$("#settings_mode").change(function(event) {
			var newEditorMode = $(this).val();
			_changeEditorMode(newEditorMode);
		});

		$("#examples_mode").change(function(event) {
			_loadExamples($(this).val());
		});

		$("#settings_theme").change(function(event) {
			var newTheme = $(this).val();
			_changeEditorTheme(newTheme);
		});

		$("#run").click(function(){
			_runCode();
		});

		$("#open").click(function(){
			_openFile();		
		});

		$("#save").click(function(){
			_saveFile();
		});

		$("#save_file_editor").click(function(){
			_saveFileEditor();
		});

		$("#save_editor").click(function(){
			_saveFileLS();
		});

		$("#save_scorm").click(function(){
			exportToSCORM();
		});

		$("#refresh").click(function(){
			if(typeof _currentExercise != "undefined"){
				var r = confirm(C.I18n.getTrans("i.reloadExerciseConfirmation"));
				if (r === true) {
					_loadJSON(_currentExercise);
					C.UI.cleanPreview();
				}
			} else {
				C.Utils.showDialog(C.I18n.getTrans("i.noExerciseToReload"));
			}
		});

		$("#loadExample").click(function(){
			//Load current example
			var exampleToLoad = $("#examples_panel #examples_selection").val();
			if(typeof _examples[exampleToLoad] !== "undefined"){
				if(_isValidJSON(_examples[exampleToLoad])){
					$("#examples").trigger("click");
					_loadJSON(_examples[exampleToLoad]);
				}
			}
		});

		$("#test_menu_wrapper").click(function(){
			var dialogDOM = $("#test_exercises_dialog");
			var dialogTitle;

			if(isEditorMode()){
				var errors = _saveCurrentJSON({raise_errors: true});
				if(errors.length > 0){
					return;
				}
				dialogTitle = $("#testTitleInput").val();
				if(dialogTitle.trim()===""){
					dialogTitle = C.I18n.getTrans("i.untitled");
				}
				C.UI.updateTestMenuDialog();
			} else {
				dialogTitle = _currentTest.title;
			}

			$(dialogDOM).attr("Title",dialogTitle);

			var dialogWidth = 400;
			var dialogHeight = "auto";

			$(dialogDOM).dialog({
				autoOpen: true,
				dialogClass:'testMenuWrapper',
				closeOnEscape: true,
				resizable: false,
				draggable: false,
				width: dialogWidth,
				height: dialogHeight,
				modal: true,
				position: {my: "left top", at: "left bottom", of: "#test_menu_wrapper"},
				open: function(event, ui) {
					//Close dialog when click outside
					$('.ui-widget-overlay').bind('click', function(){ 
						$(dialogDOM).dialog('close'); 
					});
				},
				close: function(event, ui){
					$("#test_menu_wrapper > div").removeClass("open");
					// $(this).empty().dialog('destroy');
					$(this).dialog('destroy');
				}
			});

			//Add some extra top margin.
			var newDialogDOM = $(".testMenuWrapper");
			$(newDialogDOM).css("margin-top", $(newDialogDOM).cssNumber("margin-top") + 10 + "px");

			addArrowToDialog(newDialogDOM,"top");

			$("#test_menu_wrapper > div").addClass("open");

			return false;
		});

		$("#test_title").click(function(){
			$("#test_menu_wrapper").trigger("click");
		});

		$("#openurl").click(function(){
			if($(this).attr("disabled")!=="disabled"){

				var dialogDOM = $("#file_url_dialog");
				$(dialogDOM).attr("Title",C.I18n.getTrans("i.loadFileURLTitle"));

				var dialogWidth = 400;
				var dialogHeight = "auto";

				$(dialogDOM).dialog({
					autoOpen: true,
					dialogClass:'file_url_dialog',
					closeOnEscape: true,
					resizable: false,
					draggable: false,
					width: dialogWidth,
					height: dialogHeight,
					modal: true,
					open: function(event, ui) {
						//Close dialog when click outside
						$('.ui-widget-overlay').bind('click', function(){
							$(dialogDOM).dialog('close'); 
						});
					},
					close: function(event, ui){
						$(dialogDOM).find("input").val("");
						$(this).dialog('destroy');
					}
				});
			}
		});

		$("#file_url_dialog .codeditor_button").click(function(){
			var input = $("#file_url_dialog").find("input");
			var fileURL = $(input).val();
			var dialogDOM = $("#file_url_dialog");
			$(dialogDOM).dialog('close');
			_onGetExternalJSONFile(fileURL);
		});

		$("#open_lsfile").click(function(){
			if($(this).hasClass("active")){
				$(this).removeClass("active");
				$("#lsfiles_panel").hide();
			} else {
				C.Utils.closePanels();
				_loadFSFiles();
				$(this).addClass("active");
				$("#lsfiles_panel").show();
			}
		});

		$("#lsfiles_panel .codeditor_button[action='open']").click(function(){
			if($(this).hasClass("disabled")){
				return;
			}

			var lsKey = $("#lsfiles_select").val();
			C.Utils.closePanels();
			_loadFileLS(lsKey);
		});

		$("#lsfiles_panel .codeditor_button[action='delete']").click(function(){
			if($(this).hasClass("disabled")){
				return;
			}

			var r = confirm(C.I18n.getTrans("i.deleteResourceConfirmation"));
			if (r === true) {
				var lsKey = $("#lsfiles_select").val();
				_deleteFileLS(lsKey);
			}
		});

		$("#preview_button").click(function(){
			var errors = _saveCurrentJSON({raise_errors: true});
			if(errors.length === 0){
				//Open preview dialog
				$('<iframe class="preview_iframe" src="index.html"></iframe>').dialog({
					autoOpen: true,
					dialogClass:'previewDialog',
					title: C.I18n.getTrans("i.previewDialogTitle"),
					width: "90%",
					height: 500,
					closeOnEscape: true,
					resizable: false,
					draggable: false,
					modal: true,
					open: function(event, ui) {
						_resizePreviewDialog($(this));
					}
				});
			}
		});

		$("#test_settings").click(function(){
			if(typeof _currentTest == "undefined"){
				//Create Test
				var r = confirm(C.I18n.getTrans("i.createTestConfirmation"));
				if (r === true) {
					_onCreateTest();
				}
			} else {
				_openEditorTestPanel();
			}
		});

		$("#new_resource").click(function(){
			//Create new resource
			var r = confirm(C.I18n.getTrans("i.createResourceConfirmation"));
			if (r === true) {
				_onCreateNewResource();
			}
		});

		$("#editor_tab p").click(function(){

			var isActive = $(this).hasClass("active");
			if(isActive){
				$(this).removeClass("active");
				C.Utils.closePanels();
			};

			switch(_currentEditorMode){
				case "JavaScript":
					if(_isScore){
						if(!isActive){
							C.Utils.closePanels();
							_loadScorePanel();
							$(this).addClass("active");
							$("#score_function_panel").show();
						}
					}
					break;
				case "HTML":
					if(!isActive){
						C.Utils.closePanels();
						_loadHTMLPanel();
						$(this).addClass("active");
						$("#html_panel").show();
					}
					break;
				default:
					break;
			}
		});

		$("#score_function_panel .codeditor_button[action='add_score_var']").click(function(){
			if($(this).hasClass("disabled")){
				return;
			}
			_addScoreVar($("#score_var_name_input").val());
			_loadScorePanel();
		});

		$("#score_function_panel .codeditor_button[action='delete']").click(function(){
			if($(this).hasClass("disabled")){
				return;
			}
			_removeScoreVar($("#score_vars_select").val());
			_loadScorePanel();
		});

		$('#html_panel table.libraries input[type="checkbox"]').change(function(){
			_applyLibrary($(this).attr("value"),$(this).is(':checked'));
		});

		$("#metadata").click(function(){
			if($(this).hasClass("active")){
				$(this).removeClass("active");
				$("#metadata_panel").hide();
			} else {
				C.Utils.closePanels();
				_loadScorePanel();
				$(this).addClass("active");
				$("#metadata_panel").show();
			}
		});

		$("#exit").click(function(){
			if(typeof _currentExercise !== "undefined"){
				var r = confirm(C.I18n.getTrans("i.quitExerciseConfirmation"));
				if (r === true) {
					_exitFromCurrentExercise();
				}
			}
		});
	};

	var _resizePreviewDialog = function(iframe){
		var theDialog = $(iframe).parent();
		var dialogHeight = $(theDialog).height();
		var headerHeight = $(theDialog).find(".ui-dialog-titlebar").outerHeight();
		$(iframe).height(dialogHeight-headerHeight);
	};

	var addArrowToDialog = function(dialogDOM, position){
		//Remove old arrows
		$(dialogDOM).find(".dialog_arrow").remove();

		var arrowDOM = $('<div class="dialog_arrow"></div>');
		var arrowShape = $('<div class="arrow_shape"></div>');
		$(arrowDOM).prepend(arrowShape);

		if(position==="top"){
			$(arrowShape).addClass("arrow-top");
		} else {
			$(arrowShape).addClass("arrow-bottom");
		}

		$(dialogDOM).prepend(arrowDOM);

		var arrowLeft = ($("#test_menu_wrapper").offset().left - $(dialogDOM).offset().left) + 10;
		$(arrowDOM).css("left",arrowLeft);
	};

	var _openFile = function(){
		if(!C.Utils.isFileReaderSupported()){
			return C.Utils.showDialog(C.I18n.getTrans("i.fileReaderSupportDeny"));
		}

		var fileInput = document.getElementById('openFileInput');
		fileInput.addEventListener('change', _fileHandler);
	};

	var _fileHandler = function(){
		var fileInput = document.getElementById('openFileInput');
		var file = fileInput.files[0];
		var fileType = _isValidFileType(file);

		if (fileType!==false) {
			var reader = new FileReader();

			reader.onload = function(e){
				_resetFileHandler(fileInput);
				_processFile(reader.result,fileType);
			}

			reader.onerror = function(e){
				_resetFileHandler(fileInput);
				C.Utils.showDialog(C.I18n.getTrans("i.errorReadingFile"));
			}

			reader.readAsText(file);
		} else {
			_resetFileHandler(fileInput);
			C.Utils.showDialog(C.I18n.getTrans("i.fileFormatNotSupported"));
		}
	};

	var _resetFileHandler = function(fileInput){
		fileInput.removeEventListener('change', _fileHandler);
		$(fileInput).val("");
		fileInput.addEventListener('change', _fileHandler);
	};

	var _isValidFileType = function(file){
		var fileType = file.type;

		if(typeof fileType !== "string"){
			return false;
		}

		var acceptedTypes = ["text/html","application/javascript","application/json","text/plain",/text.*/];

		for(var i=0; i<acceptedTypes.length; i++){
			if(fileType.match(acceptedTypes[i])){
				return acceptedTypes[i];
			}
		}

		//Look for JSON files
		if(fileType.trim()===""){
			if(file.name.match(/\.json$/)){
				//fileName ends with ".json"
				return "application/json";
			}
		}

		return false;
	};

	//Get external file from fileURL
	var _getExternalJSONFile = function(fileURL,successCallback,failCallback){
		if(typeof fileURL !== "string"){
			return;
		}
		
		$.getJSON(fileURL, function(data){
			if(typeof successCallback == "function"){
				successCallback(data);
			}
		}).error(function(jqXHR,textStatus,errorThrown){
			if(typeof failCallback == "function"){
				failCallback(jqXHR,textStatus,errorThrown);
			}
		}).complete(function(){
		});
	};

	var _processFile = function(fileContent,fileType){
		if(typeof fileContent !== "string"){
			return C.Utils.showDialog(C.I18n.getTrans("i.fileFormatNotSupported"));
		}

		//Look for valid JSON
		if((fileType==="application/json")||(fileType==="text/plain")||(fileType.toString()==="/text.*/")){
			if(_containsValidJSON(fileContent)){
				_currentLSKey = undefined;
				var json = JSON.parse(fileContent);
				if(isEditorMode()){
					return _initExerciseMode(json);
				} else {
					return _loadJSON(json);
				}
			}
		}

		if(isEditorMode()){
			return C.Utils.showDialog(C.I18n.getTrans("i.fileFormatNotSupported"));
		}

		var editorContent = undefined;

		if(fileType==="text/html"){
			//HTML file
			_changeEditorMode("HTML");
		} else if (fileType==="application/javascript"){
			//JS file.
			_changeEditorMode("JavaScript");
			return true;
		} else if ((fileType==="text/plain")||(fileType.toString()==="/text.*/")){
			//Text files. Load as HTML file.
			_changeEditorMode("HTML");
		} else {
			//Unknown file.
			_changeEditorMode("HTML");
		}

		_editor.setValue(fileContent,1);
		_focusEditor();
	};

	var _containsValidJSON = function(fileContent){
		try{
			fileContent = JSON.parse(fileContent);
			if(_isValidJSON(fileContent)){
				return true;
			}
		} catch (e) {}
		return false;
	};

	var _saveFile = function(){
		if(!CODEditor.Utils.isFileSaverSupported()){
			C.Utils.showDialog(C.I18n.getTrans("i.fileSaverSupportDeny"));
		}

		var filename = C.I18n.getTrans("i.untitled");
		if(typeof _currentExercise != "undefined"){
			if((typeof _currentExercise.title == "string")&&(_currentExercise.title.trim()!=="")){
				filename = _currentExercise.title;
			}
			filename +=  " - " + C.I18n.getTrans("i.solution");
		}

		switch(_currentEditorMode){
			case "HTML":
				if(typeof _currentExercise == "undefined"){
					filename = "index";
				}
				filename += ".html";
				break;
			case "JavaScript":
				if(typeof _currentExercise == "undefined"){
					filename = "script";
				}
				filename += ".js";
				break;
			default:
				filename += ".txt";
				return;
		}

		var dataToDownload = _editor.getValue();
		var blob = new Blob([dataToDownload], {type: "text/plain;charset=utf-8"});
		saveAs(blob, filename);
	};

	var _saveFileEditor = function(){
		if(!CODEditor.Utils.isFileSaverSupported()){
			return C.Utils.showDialog(C.I18n.getTrans("i.fileSaverSupportDeny"));
		}

		var errors = _saveCurrentJSON({raise_errors: true});
		
		if(errors.length > 0){
			return;
		}

		var currentResource = getCurrentResource();

		if(typeof currentResource === "object"){
			var filename = getCurrentResourceTitle() + ".json";
			var dataToDownload = JSON.stringify(currentResource);
			_lastSavedResource = dataToDownload;
			var blob = new Blob([dataToDownload], {type: "text/plain;charset=utf-8"});
			saveAs(blob, filename);

			C.Utils.showDialog(C.I18n.getTrans("i.savedSuccessfully"));
		}
	};

	var _saveFileLS = function(){
		var errors = _saveCurrentJSON({raise_errors: true});
		if(errors.length > 0){
			return;
		}

		var currentResource = getCurrentResource();

		if(typeof currentResource === "object"){
			var record = {};
			record.saved_at = new Date();
			record.resource = currentResource;

			var key;
			if(typeof _currentLSKey === "string"){
				key = _currentLSKey;
			} else {
				key = (new Date().getTime()).toString();
			}

			_currentLSKey = key;
			localStorage.setItem(key,JSON.stringify(record));
			_lastSavedResource = JSON.stringify(currentResource);

			C.Utils.showDialog(C.I18n.getTrans("i.savedSuccessfully"));
		}
	};

	var _loadFileLS = function(key){
		var json;
		try {
			json = JSON.parse(localStorage.getItem(key)).resource;
		} catch (e){}
		if(_isValidJSON(json)){
			_currentLSKey = key;
			_initExerciseMode(json);
		} else {
			C.Utils.showDialog(C.I18n.getTrans("i.invalidResourceToLoad"));
		}
	};

	var _deleteFileLS = function(key){
		localStorage.removeItem(key);
		_loadFSFiles();
	};

	var _saveCurrentJSON = function(options){
		if(typeof options != "object"){
			options = {};
		}
		if(typeof _currentExercise != "object"){
			_currentExercise = {};
		}

		_currentExercise.type = "exercise";
		_currentExercise.title = $("#exerciseTitleInput").val();
		_currentExercise.description = $("#exerciseDescriptionTextArea").val();

		if(_isScore){
			var scoreFunctionValue = _editor.getValue();
			if(_isValidScoreFunctionValue(scoreFunctionValue)){
				_currentExercise.score_function = scoreFunctionValue;
				_inferScoreFunctionVars();
			} else {
				delete _currentExercise.score_function;
				delete _currentExercise.parsed_score_function;
				delete _currentExercise.score_function_vars;
			}
		} else {
			_currentExercise.content = _editor.getValue();
			_currentExercise.editorMode = _currentEditorMode;
		}

		//Metadata
		var metadata = C.UI.getMetadataFromUI();
		var currentResource = getCurrentResource();
		if((typeof metadata === "object")&&(Object.keys(metadata).length > 0)){
			currentResource.metadata = metadata;
		}
		
		var errors = _validateJSON(_currentExercise,{updateCurrent: true});
		delete _currentExercise.id;

		if((typeof _currentTest != "undefined")&&(errors.length === 0)){
			//Save test
			_currentTest.title = $("#testTitleInput").val();
			delete _currentExercise.metadata;
			_updateCurrentTestWithCurrentExercise();
			errors = _validateJSON(_currentTest,{updateCurrent: true});
		}

		if(errors.length > 0){
			if(options.raise_errors===true){
				C.Utils.showDialogWithErrors(C.I18n.getTrans("i.resourceHasErrors"), errors);
			}
		}

		return errors;
	};


	var fileSourcesCounter;
	var fileSourcesLength;

	var exportToSCORM = function(){
		var errors = _saveCurrentJSON({raise_errors: true});

		if(errors.length > 0){
			return;
		}

		var zip = new JSZip();

		var packageFileTree = {};
		var filesSources = [];

		filesSources.push("index.html");
		// filesSources.push("lms_index.html");
		
		filesSources.push("imsmanifest.xml");
		var scormConstantFiles = ["adlcp_v1p3.xsd","adlnav_v1p3.xsd","adlseq_v1p3.xsd","imscp_v1p1.xsd","imsss_v1p0.xsd","lom.xsd",	"common/anyElement.xsd", "common/dataTypes.xsd", "common/elementNames.xsd", "common/elementTypes.xsd", "common/rootElement.xsd", "common/vocabTypes.xsd", "common/vocabValues.xsd", "extend/custom.xsd", "extend/strict.xsd", "unique/loose.xsd", "unique/strict.xsd", "vocab/adlmd_vocabv1p0.xsd", "vocab/custom.xsd", "vocab/loose.xsd", "vocab/strict.xsd"];
		for(var s=0; s<scormConstantFiles.length; s++){
			filesSources.push(scormConstantFiles[s]);
		}

		$("link[href]").each(function(index,value){
			filesSources.push($(value).attr("href"));
		});

		$("script[src]").each(function(index,value){
			filesSources.push($(value).attr("src"));
		});

		$("img[src]").each(function(index,value){
			filesSources.push($(value).attr("src"));
		});

		//Extra images
		var extraImages = ["img/error_icon.png","img/success_icon.png","img/fullscreen_off.png","img/maximize_console.png","img/minimize_console.png"];
		for(var ii=0; ii<extraImages.length; ii++){
			filesSources.push(extraImages[ii]);
		}

		//Delete duplicated values
		var uniqFileSources = [];
		for(var i=0; i<filesSources.length; i++){
			if(uniqFileSources.indexOf(filesSources[i])===-1){
				uniqFileSources.push(filesSources[i]);
			}
		}
		filesSources = uniqFileSources;

		fileSourcesCounter = 0;
		fileSourcesLength = filesSources.length;

		for(var i=0; i<filesSources.length; i++){
			var splitValue = filesSources[i].split("/");
			var splitLength = splitValue.length;
			var currentFolder = packageFileTree;
			for(var j=0; j<splitLength; j++){
				if(j!=(splitLength-1)){
					//Folder
					if(typeof currentFolder[splitValue[j]] == "undefined"){
						currentFolder[splitValue[j]] = {};
					}
					currentFolder = currentFolder[splitValue[j]];
				} else {
					currentFolder[splitValue[j]] = splitValue[j];
				}
			}
		};

		_zipFolder(zip,undefined,undefined,packageFileTree,"");
	};

	var _zipFolder = function(zipRoot,zipParent,folderName,folderContent,path){
		if(typeof zipParent !== "undefined"){
			window["folder_" + folderName] = zipParent.folder(folderName);
			var folder = window["folder_" + folderName];
		} else {
			var folder = zipRoot;
		}
		for(var key in folderContent){
			var file = folderContent[key];
			if(path !== ""){
				var fileFullPath = path+"/"+key;
			} else {
				var fileFullPath = key;
			}
			if(typeof file === "object"){
				_zipFolder(zipRoot,folder,key,file,fileFullPath);
			} else {
				_zipFile(zipRoot,folder,key,fileFullPath);
			}
		}
	};

	var _zipFile = function(zipRoot,zipParent,fileName,fileFullPath){
		JSZipUtils.getBinaryContent(fileFullPath, function (err, data) {
			if(err) {
				throw err;
			}
			zipParent.file(fileName, data, {binary:true});
			_onZipFileInSCORM(zipRoot);
		});
	};

	var _onZipFileInSCORM = function(zip){
		fileSourcesCounter++;
		if(fileSourcesCounter>=fileSourcesLength){
			_onFinishExportSCORMStep1(zip);
		}
	};

	var _onFinishExportSCORMStep1 = function(zip){
		var currentResource = getCurrentResource();

		if(typeof currentResource != "undefined"){
			//CODEditor.File.js
			zip.file("CODEditor.Viewer.js", "var CODEditor = CODEditor || {};\nCODEditor.Viewer = true;\nCODEditor.File = " + JSON.stringify(currentResource));
			
			var filesCount = 2;

			var metadata = C.UI.getMetadataFromUI();
			if((typeof metadata == "object")&&(Object.keys(metadata).length > 0)){
				//Modify imsmanifest.xml
				JSZipUtils.getBinaryContent("imsmanifest.xml", function (err, data) {
					if(err) {
						throw err;
					}
					
					//ArrayBuffer to String
					var xmlContent = String.fromCharCode.apply(null, new Uint8Array(data));

					//Generate LOM Metadata in XML format (using marknote library: https://code.google.com/p/marknote/wiki/DevelopersGuide)
					var parser = new marknote.Parser();
					var XML_LOM_Metadata = parser.parse(xmlContent);
					var LOM_element = XML_LOM_Metadata.rootElement.getChildElement("metadata").getChildElement("lom");

					//Extra vars
					var metadata_language = (typeof metadata.language == "string") ? metadata.language : "en";
					var metadata_title = C.Utils.encodeForXML(metadata.title);
					var metadata_description = C.Utils.encodeForXML(metadata.description);

					//<general>
					var generalElement = LOM_element.getChildElement("general");
					
					if(typeof metadata_title === "string"){
						var titleElement = new marknote.Element("title");
						var titleStringElement = new marknote.Element("string");
						titleStringElement.setAttribute("language", metadata_language);
						titleStringElement.setText(metadata_title);
						titleElement.addChildElement(titleStringElement);
						generalElement.addChildElement(titleElement);
					}

					if(typeof metadata.language === "string"){
						var languageElement = new marknote.Element("language");
						languageElement.setText(metadata.language);
						generalElement.addChildElement(languageElement);
					}

					if(typeof metadata_description === "string"){
						var descriptionElement = new marknote.Element("description");
						var descriptionStringElement = new marknote.Element("string");
						descriptionStringElement.setAttribute("language", metadata_language);
						descriptionStringElement.setText(metadata_description);
						// var descriptionCDATA = new marknote.CDATA(metadata_description);
						// descriptionStringElement.addContent(descriptionCDATA);
						descriptionElement.addChildElement(descriptionStringElement);
						generalElement.addChildElement(descriptionElement);
					}

					if(metadata.keywords instanceof Array){
						var keywordsLength = metadata.keywords.length;
						for(var i=0; i<keywordsLength; i++){
							var keywordElement = new marknote.Element("keyword");
							var keywordStringElement = new marknote.Element("string");
							keywordStringElement.setAttribute("language", metadata_language);
							keywordStringElement.setText(metadata.keywords[i]);
							keywordElement.addChildElement(keywordStringElement);
							generalElement.addChildElement(keywordElement);
						}
					}

					var structureElement = new marknote.Element("structure");
					var structureSourceElement = new marknote.Element("source");
					structureSourceElement.setText("LOMv1.0");
					var structureValueElement = new marknote.Element("value");
					var LO_structure = (currentResource.type==="test") ? "linear" : "atomic";
					structureValueElement.setText(LO_structure);
					structureElement.addChildElement(structureSourceElement);
					structureElement.addChildElement(structureValueElement);
					generalElement.addChildElement(structureElement);

					var aggregationElement = new marknote.Element("aggregationLevel");
					var aggregationSourceElement = new marknote.Element("source");
					aggregationSourceElement.setText("LOMv1.0");
					var aggregationValueElement = new marknote.Element("value");
					var LO_aggregation = (currentResource.type==="test") ? 2 : 1;
					aggregationValueElement.setText(LO_aggregation);
					aggregationElement.addChildElement(aggregationSourceElement);
					aggregationElement.addChildElement(aggregationValueElement);
					generalElement.addChildElement(aggregationElement);

					//<technical>
					var technicalElement = LOM_element.getChildElement("technical");
					var toolElement = technicalElement.getChildElement("otherPlatformRequirements").getChildElementAt(1);
					if(toolElement instanceof marknote.Element){
						toolElement.setText("CODEditor " + CODEditor.VERSION + " (http://github.com/agordillo/CodeEditorApp)");
					}
					
					//<educational>
					var educationalElement = LOM_element.getChildElement("educational");

					if(typeof metadata.age_range === "string"){
						var ageElement = new marknote.Element("typicalAgeRange");
						var ageStringElement = new marknote.Element("string");
						ageStringElement.setAttribute("language", metadata_language);
						ageStringElement.setText(metadata.age_range);
						ageElement.addChildElement(ageStringElement);
						educationalElement.addChildElement(ageElement);
					}

					if(typeof metadata.difficulty === "string"){
						var difficultyElement = new marknote.Element("difficulty");
						var difficultySourceElement = new marknote.Element("source");
						difficultySourceElement.setText("LOMv1.0");
						var difficultyValueElement = new marknote.Element("value");
						difficultyValueElement.setText(metadata.difficulty);
						difficultyElement.addChildElement(difficultySourceElement);
						difficultyElement.addChildElement(difficultyValueElement);
						educationalElement.addChildElement(aggregationElement);
					}

					if(typeof metadata.TLT === "string"){
						var TLTElement = new marknote.Element("typicalLearningTime");
						var TLTdurationElement = new marknote.Element("duration");
						TLTdurationElement.setText(metadata.TLT);
						TLTElement.addChildElement(TLTdurationElement);
						educationalElement.addChildElement(TLTElement);
					}

					if(typeof metadata_description === "string"){
						var eDescriptionElement = new marknote.Element("description");
						var eDescriptionStringElement = new marknote.Element("string");
						eDescriptionStringElement.setAttribute("language", metadata_language);
						eDescriptionStringElement.setText(metadata_description);
						// var eDescriptionCDATA = new marknote.CDATA(metadata_description);
						// eDescriptionStringElement.addContent(eDescriptionCDATA);
						eDescriptionElement.addChildElement(eDescriptionStringElement);
						educationalElement.addChildElement(eDescriptionElement);
					}

					if(typeof metadata.language === "string"){
						var eLanguageElement = new marknote.Element("language");
						eLanguageElement.setText(metadata.language);
						educationalElement.addChildElement(eLanguageElement);
					}


					xmlContent = XML_LOM_Metadata.toString("  ");
					zip.file("imsmanifest.xml", xmlContent);

					filesCount -= 1;
					if(filesCount===0){
						_onFinishExportSCORM(zip);
					}
				});
			} else {
				filesCount -= 1;
			}

			//Modify index.html
			JSZipUtils.getBinaryContent("index.html", function (err, data) {
				if(err) {
					throw err;
				}
				
				//ArrayBuffer to String
				var indexHTMLContent = String.fromCharCode.apply(null, new Uint8Array(data));
				var position = indexHTMLContent.indexOf("</head>");

				var fileScript = '<script src="CODEditor.Viewer.js" type="text/javascript" charset="utf-8"></script>';
				
				indexHTMLContent = (indexHTMLContent.substr(0, position) + "    " + fileScript + "\n" + indexHTMLContent.substr(position));
				zip.file("index.html", indexHTMLContent);

				filesCount -= 1;
				if(filesCount===0){
					_onFinishExportSCORM(zip);
				}
			});

		} else {
			_onFinishExportSCORM(zip);
		}
	};

	var _onFinishExportSCORM = function(zip){
		var content = zip.generate({type:"blob"});
		saveAs(content, (getCurrentResourceTitle() + ".zip"));
	};

	var getCurrentResource = function(){
		if(typeof _currentTest != "undefined"){
			return _currentTest;
		} else if(typeof _currentExercise != "undefined"){
			return _currentExercise;
		}
	};

	var getCurrentResourceTitle = function(){
		if((typeof getCurrentResource() != "undefined")&&(typeof getCurrentResource().title == "string")&&(getCurrentResource().title.trim()!="")){
			return getCurrentResource().title;
		}
		return C.I18n.getTrans("i.untitled");
	};

	var _changeViewMode = function(viewMode){
		if((_viewModes.indexOf(viewMode)!=-1)&&(viewMode!=_currentViewMode)){
			var oldViewMode = _currentViewMode;
			var wrappersDOM = $("#editor_wrapper, #preview_wrapper");
			for(var i in _viewModes){
				if(viewMode === _viewModes[i]){
					_currentViewMode = viewMode;
					$(wrappersDOM).addClass(viewMode);
					$("ul.menu > li[group='view'][viewMode='"+viewMode+"']").addClass("active");
				} else {
					$(wrappersDOM).removeClass(_viewModes[i]);
					$("ul.menu > li[group='view'][viewMode='"+_viewModes[i]+"']").removeClass("active");
				}
			};
			if(isEditorMode()){
				_onChangeViewMode(oldViewMode,viewMode);
			}
			if(typeof _editor != "undefined"){
				_editor.resize();
			}
			C.UI.adjustView();
		}
	};

	var _changeEditorMode = function(editorMode,options){
		if(typeof options != "object"){
			options = {is_new: true}
		}

		var previewMode = editorMode;
		if(options.preview_mode){
			previewMode = options.preview_mode;
		}

		if((_editorModes.indexOf(editorMode)!=-1)&&((typeof options.initial_text == "string")||(editorMode!=_currentEditorMode)||(previewMode!=_currentPreviewMode))){

			$("#preview_wrapper #preview_header").html("");
			$("#preview_wrapper #preview").html("");

			for(var i in _editorModes){
				if(editorMode === _editorModes[i]){
					_currentEditorMode = editorMode;
					$("#editor_wrapper").addClass(editorMode);
					$("#editorModeMenu").html(editorMode);
				} else {
					$("#editor_wrapper").removeClass(_editorModes[i]);
				}

				if(previewMode === _editorModes[i]){
					_currentPreviewMode = previewMode;
					$("#preview_wrapper").addClass(previewMode);
				} else {
					$("#preview_wrapper").removeClass(_editorModes[i]);
				}
			};

			if(typeof _editor != "undefined"){

				var aceMode;

				switch(editorMode){
					case "HTML":
						aceMode = "ace/mode/html";
						$("#editor_tab p").html("index.html");
						$("#preview_wrapper.HTML #preview_header").html("<p>" + C.I18n.getTrans("i.result") + "</p>");
						break;
					case "JavaScript":
						aceMode = "ace/mode/javascript";
						if(_isScore){
							$("#editor_tab p").html("score.js");
							if(_currentViewMode!=="HYBRID"){
								$("ul.menu li[viewmode='CODE']").removeClass("active");
								$("ul.menu li[viewmode='SCORE']").addClass("active");
							}
						} else {
							$("#editor_tab p").html("script.js");
							if(_currentViewMode!=="HYBRID"){
								$("ul.menu li[viewmode='CODE']").addClass("active");
								$("ul.menu li[viewmode='SCORE']").removeClass("active");
							}
						}
						break;
					default:
						return;
				}

				switch(previewMode){
					case "HTML":
						$("#preview_wrapper.HTML #preview_header").html("<p>" + C.I18n.getTrans("i.result") + "</p>");
						break;
					case "JavaScript":
						$("#preview_wrapper.JavaScript #preview_header").html("<p>" + C.I18n.getTrans("i.console") + "</p><div id='consoleButtons'><img id='closeJSconsole' title='" +  C.I18n.getTrans("i.closeConsole") + "' src='img/close_console.png'/></div>");
						$("#closeJSconsole").click(function(){
							if(_isScore){
								_changeViewMode("SCORE");
							} else {
								_changeViewMode("CODE");
							}
							
						});
						break;
					default:
						return;
				}

				if(typeof aceMode == "string"){
					_editor.getSession().setMode(aceMode);
					if(typeof options.initial_text == "string"){
						_editor.setValue(options.initial_text,1);
					} else if(options.is_new){
						_editor.setValue(defaultValues[editorMode],1);
					}
				}
			}

			C.UI.updateSettingsPanel();
		}
	};

	var _changeEditorTheme = function(editorTheme){
		if((_editorThemes.indexOf(editorTheme)!=-1)&&(editorTheme!=_currentEditorTheme)){

			$("body").removeAttr("theme");

			for(var i in _editorThemes){
				if(editorTheme === _editorThemes[i]){
					_currentEditorTheme = editorTheme;
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
					_editor.setTheme(aceTheme);
				}
			}
		}
	};

	var _runCode = function(){
		if(typeof _editor == "undefined"){
			return;
		}

		C.UI.cleanPreview();

		var editorMode;
		var code;
		if(isViewerMode()){
			code = _editor.getValue();
			editorMode = _currentEditorMode;
		} else {
			_saveCurrentJSON();
			if(_currentExercise){
				code = _currentExercise.content;
				editorMode = _currentExercise.editorMode;
			} else {
				return;
			}
		}
		

		if((_currentViewMode === "CODE")||(_currentViewMode === "SCORE")){
			_changeViewMode("HYBRID");
		}

		switch(editorMode){
			case "HTML":
				return C.HTML.runHTMLcode(code);
			case "JavaScript":
				return C.JS.runJavaScriptcode(code);
			default:
				return;
		}
	};

	var _loadJSON = function(json){
		var errors = _validateJSON(json,{updateCurrent: true});

		if(errors.length > 0){
			return C.Utils.showDialogWithErrors(C.I18n.getTrans("i.resourceHasErrors"), errors);
		}

		switch(json.type){
			case "exercise":
				if(isViewerMode()){
					return _loadExercise(json);
				} else {
					return _loadExerciseEditor(json);
				}
			case "test":
				if(isViewerMode()){
					return _loadTest(json);
				} else {
					return _loadTestEditor(json);
				}
			default:
				return C.Utils.showDialog(C.I18n.getTrans("i.invalidResourceToLoad"));
		}
	};

	var _loadTest = function(json){
		var exerciseDOM = $("#exercise_wrapper");
		$(exerciseDOM).addClass("open");

		//Load test header
		$("#test_header").css("display","inline-block");
		
		//Load title
		var testTitle = ("#test_title");
		$(testTitle).html(json.title);

		var testMenuWrapper = $("#test_menu_wrapper");
		$(testMenuWrapper).css("display","inline-block");

		if((_isDefaultMode===false)&&(typeof _initOptions.index === "number")){
			loadTestExercise(_initOptions.index);
		} else {
			_loadNextTestExercise();
		}

		//Populate MenuWrapper
		C.UI.updateTestMenuDialog();
	};

	var _loadExercise = function(json){
		var exerciseDOM = $("#exercise_wrapper")
		$(exerciseDOM).addClass("open");

		//Load title
		var exerciseTitleDOM = $("#exercise_title");
		if(json.title){
			$(exerciseTitleDOM).html(json.title);
			$(exerciseTitleDOM).show();
		} else {
			$(exerciseTitleDOM).hide();
		}

		//Load description
		if(typeof json.description === "string"){
			var descriptionToShow = C.Utils.purgeTextString(json.description);
			//Look for code tags.
			descriptionToShow = descriptionToShow.replace(/&lt;code&gt;/g, '<pre class="code">');
			descriptionToShow = descriptionToShow.replace(/&lt;\/code&gt;/g, '</pre>');
			$("#exercise_description").show();
			$("#exercise_description").html("<pre>" + descriptionToShow + "</pre>");
		} else {
			$("#exercise_description").hide();
		}

		//Editor mode
		_changeEditorMode(json.editorMode,{is_new: false});

		//Block editorMode in settings
		$("#settings_mode").attr("disabled","disabled");

		//Show exercises group in toolbar
		$("ul.menu li[group='exercise']").css("display","inline-block");

		if(_isDefaultMode!==true){
			//Disallow loading files/resources
			$("#openFileInput").attr("disabled","disabled");
			$("label[for=openFileInput]").attr("disabled","disabled");
			$("#open").hide();

			$("#openurl").attr("disabled","disabled");
			$("#openurl").hide();

			$("#refresh").addClass("last");
			$("#save").removeClass("first").removeClass("last").addClass("unique");
		} else {
			//Show exit feature
			$("ul.menu li[group*='exerciseonlydefault']").css("display","inline-block");
		}

		C.UI.cleanPreview();

		if(typeof json.content == "string"){
			_editor.setValue(json.content,1);
		}
		
		C.UI.adjustView();

		if(typeof _currentTest != "undefined"){
			C.UI.updateUIAfterNewExerciseOnTest();
		}

		C.ProgressTracking.onLoadExercise(json);
	};

	var _loadExerciseEditor = function(json){
		_currentExercise = json;

		var exerciseDOM = $("#exercise_wrapper");
		$(exerciseDOM).addClass("open");

		//Title
		if(json.title){
			$("#exerciseTitleInput").val(json.title);
		} else {
			$("#exerciseTitleInput").val("");
		}
		 
		//Description
		if(json.description){
			$("#exerciseDescriptionTextArea").val(json.description);
		} else {
			$("#exerciseDescriptionTextArea").val("");
		}

		if(typeof _currentTest != "undefined"){
			C.UI.updateUIAfterNewExerciseOnTest();
		}

		var editorMode = (typeof json.editorMode == "string") ? json.editorMode : "JavaScript";
		var content = (typeof json.content == "string") ? json.content : "";
		_isScore = false;
		_changeViewMode("CODE");
		_changeEditorMode(editorMode,{initial_text: content});

		C.UI.adjustView();
	};

	var _loadTestEditor = function(json){
		var exerciseDOM = $("#exercise_wrapper");
		$(exerciseDOM).addClass("open");
		
		//Load test header
		$("#test_header").css("display","inline-block");
		
		$("#test_menu_wrapper").css("display","inline-block");
		$("#test_menu_wrapper").addClass("test_menu_wrapper_editor");

		//Load title
		if(json.title){
			$("#testTitleInput").val(json.title);
		}

		//Menu
		$("#test_settings").find("img").attr("title",C.I18n.getTrans("i.menuSetUpTest"));

		_currentExerciseIndex = 0;
		_loadNextTestExercise();

		//Populate MenuWrapper
		C.UI.updateTestMenuDialog();

		C.UI.adjustView();
	};

	var _unloadTestEditor = function(){
		$("#test_header").css("display","none");
		$("#test_menu_wrapper").css("display","none");
		$("#testTitleInput").val("");
		$("#test_settings").find("img").attr("title",C.I18n.getTrans("i.menuCreateTest"));
	};

	var _onCreateTest = function(){
		var errors = _saveCurrentJSON({raise_errors: true});
		if(errors.length === 0){
			_currentTest = {};
			_currentTest.type = "test";
			_currentTest.title = "";
			_currentTest.exercises = JSON.stringify([_currentExercise]);
			_loadJSON(_currentTest);
			$("#testTitleInput").focus();
		}
	};

	var _onCreateNewResource = function(){
		_currentExcercise = {};
		_currentExcercise.type = "exercise";
		_currentExcercise.title = "";
		_currentExcercise.description = "";
		_currentExcercise.editorMode = _currentEditorMode;
		_currentExcercise.content = "";

		_currentTest = undefined;
		_currentExerciseIndex = undefined;
		_currentLSKey = undefined;
		_unloadTestEditor();

		_loadJSON(_currentExcercise);
		$("#exerciseTitleInput").focus();
	};

	var _openEditorTestPanel = function(){
		$("#test_menu_wrapper").trigger("click");
	};

	var _isValidJSON = function(json){
		return (_validateJSON(json,{updateCurrent: false}).length===0);
	};

	var _validateJSON = function(json,options){
		var errors = [];

		if(typeof json !== "object"){
			errors.push(C.I18n.getTrans("i.validationInvalidJSON"));
			return errors;
		}

		if((typeof json.type !== "string")||(["exercise","test"].indexOf(json.type)===-1)){
			errors.push(C.I18n.getTrans("i.validationInvalidType"));
			return errors;
		}

		switch(json.type){
			case "exercise":
				return _validateExercise(json,options);
			case "test":
				return _validateTest(json,options);
			default:
				errors.push(C.I18n.getTrans("i.validationInvalidType"));
				return errors;
		}
	};

	var _validateTest = function(json,options){
		var errors = [];

		if(typeof json !== "object"){
			errors.push(C.I18n.getTrans("i.validationInvalidJSON"));
			return errors;
		}
		if(json.type !== "test"){
			errors.push(C.I18n.getTrans("i.validationInvalidTestType"));
		}
		if(typeof json.title !== "string"){
			errors.push(C.I18n.getTrans("i.validationInvalidTitle"));
		}

		var validExercises = true;
		try {
			var exercises = JSON.parse(json.exercises);
		} catch(e) {
			errors.push(C.I18n.getTrans("i.validationInvalidExercises"));
			validExercises = false;
		}

		//Continue with the exercises validation
		if(validExercises){
			if(!(exercises instanceof Array)){
				errors.push(C.I18n.getTrans("i.validationInvalidExercises"));
				validExercises = false;
			} else {
				if(exercises.length < 1){
					errors.push(C.I18n.getTrans("i.validationNoExercises"));
				} else {
					for(var i=0; i<exercises.length; i++){
						if(!_isValidJSON(exercises[i])){
							errors.push(C.I18n.getTrans("i.ExerciseNotValidInTest"));
							break;
						}
					}
				}
			}
		}

		var options = options || {};
		var updateCurrentTest = !(options.updateCurrent === false);
		
		if((errors.length===0)&&(updateCurrentTest)){
			_currentTest = json;
			_currentTest.exercisesQuantity = exercises.length;
			if(typeof _currentExerciseIndex == "undefined"){
				_currentExerciseIndex = 0;
			}
			_currentTest.parsed_exercises = exercises;
			for(var j=0; j<_currentTest.parsed_exercises.length; j++){
				_validateExercise(_currentTest.parsed_exercises[j],{updateCurrent: false, id: (j+1)});
				_currentTest.parsed_exercises[j].progress = {
					score: 0,
					passed: false
				}
				_currentTest.parsed_exercises[j].id = (j+1);
			}
		}

		return errors;
	};

	var _validateExercise = function(json,options){
		var errors = [];

		if(typeof json !== "object"){
			errors.push(C.I18n.getTrans("i.validationInvalidJSON"));
			return errors;
		}
		if(json.type !== "exercise"){
			errors.push(C.I18n.getTrans("i.validationInvalidExerciseType"));
		}
		if((typeof json.editorMode !== "string")||(_editorModes.indexOf(json.editorMode)===-1)){
			errors.push(C.I18n.getTrans("i.validationInvalidEMode"));
		}
		if(typeof json.description !== "undefined"){
			if(typeof json.description !== "string"){
				errors.push(C.I18n.getTrans("i.validationInvalidDescription"));
			}
		}
		if(typeof json.content !== "undefined"){
			if(typeof json.content !== "string"){
				errors.push(C.I18n.getTrans("i.validationInvalidContent"));
			}
		}
		if(typeof json.score_function !== "undefined"){
			//score_function is provided
			if (typeof json.score_function !== "string"){
				errors.push(C.I18n.getTrans("i.validationInvalidSFunction"));
			} else {
				//Check if score_function is well formed
				//The score_function is retrieved in the scoreFunctionEvaluation.response var.
				var scoreFunctionEvaluation = C.JS.validateScoreFunction(json.score_function);
				if(scoreFunctionEvaluation.errors.length > 0){
					for(var i=0; i<scoreFunctionEvaluation.errors.length; i++){
						errors.push(scoreFunctionEvaluation.errors[i]);
					}
				} else {
					if(typeof scoreFunctionEvaluation.response !== "function"){
						errors.push(C.I18n.getTrans("i.validationInvalidSFunctionType"));
					} else {
						//Check if scoreFunction returns a valid score.
						//score should be a number, or a object like {*score: {number}, errors: [], feedback: []}

						var scoreFunctionVariablesHash = {};

						if((!(json.score_function_vars instanceof Array))&&(typeof json.score_function_vars == "object")&&(typeof json.score_function_vars.length == "number")){
							//Convert json.score_function_vars to array if it's not detected as a real array
							try {
								json.score_function_vars = jQuery.extend([], json.score_function_vars);
							} catch(e){}
						}

						if(json.score_function_vars instanceof Array){
							for(var sfv=0; sfv<json.score_function_vars.length; sfv++){
								if(typeof json.score_function_vars[sfv] == "string"){
									scoreFunctionVariablesHash[json.score_function_vars[sfv]] = "";
								}
							}
						}

						try {
							var testScore = scoreFunctionEvaluation.response("",scoreFunctionVariablesHash);
							if(typeof testScore !== "number"){
								if(typeof testScore === "object"){
									if(typeof testScore.score !== "number"){
										errors.push(C.I18n.getTrans("i.validationInvalidSFunctionScore"));
									}
									if((typeof testScore.successes !== "undefined")&&(!testScore.successes instanceof Array)){
										errors.push(C.I18n.getTrans("i.validationInvalidSFunctionSuccess"));
									}
									if((typeof testScore.errors !== "undefined")&&(!testScore.errors instanceof Array)){
										errors.push(C.I18n.getTrans("i.validationInvalidSFunctionError"));
									}
									if((typeof testScore.feedback !== "undefined")&&(!testScore.feedback instanceof Array)){
										errors.push(C.I18n.getTrans("i.validationInvalidSFunctionFeedback"));
									}
								} else {
									errors.push(C.I18n.getTrans("i.validationInvalidSFunctionValue"));
								}
							} else {
								//Score is a number. Do nothing.
							}
						} catch(e) {
							errors.push(C.I18n.getTrans("i.validationInvalidSFunctionException", {exception: e.message}));
						}
					}
				}
			}
		}

		if(errors.length===0){
			
			if(typeof json.score_function !== "undefined"){
				json.parsed_score_function = scoreFunctionEvaluation.response;
			}

			var options = options || {};
			updateCurrentExercise = !(options.updateCurrent===false);

			if(typeof options.id === "number"){
				json.id = options.id;
			} else if(typeof json.id != "number"){
				json.id = 1;
			}

			if(updateCurrentExercise){
				_currentExercise = json;
			}
		}

		return errors;
	};

	var _exitFromCurrentExercise = function(){
		if(typeof _currentExercise === "undefined"){
			return;
		}

		_currentExercise = undefined;
		_currentTest = undefined;

		var exerciseDOM = $("#exercise_wrapper")
		$(exerciseDOM).removeClass("open");

		//Unload title
		var exerciseTitleDOM = $("#exercise_title");
		$(exerciseTitleDOM).hide();

		//Unload description
		$("#exercise_description").hide();

		//Unblock editorMode in settings
		$("#settings_mode").removeAttr("disabled");

		//Hide exercises group in toolbar
		$("ul.menu li[group*='exercise']").css("display","none");

		if(_isDefaultMode!==true){
			//Allow loading
			$("#openFileInput").removeAttr("disabled");
			$("label[for=openFileInput]").removeAttr("disabled");
			$("#openurl").removeAttr("disabled");
		}

		C.UI.cleanPreview();

		//Reset editor
		_editorModeToSet = _currentEditorMode;
		_currentEditorMode = undefined;
		_currentPreviewMode = undefined;
		_changeEditorMode(_editorModeToSet);
		
		C.UI.adjustView();
	};


	//Test management

	var _hasNextExercise = function(){
		return ((typeof _currentTest != "undefined")&&( _currentExerciseIndex < _currentTest.exercisesQuantity))
	};

	var _getNextExercise = function(){
		if(_hasNextExercise()){
			return _currentTest.parsed_exercises[_currentExerciseIndex];
		} else {
			return undefined;
		}
	};

	var _loadNextTestExercise = function(){
		if(_hasNextExercise()){
			var exercise = _getNextExercise();
			_currentExerciseIndex += 1;
			_loadJSON(exercise);
		}
	};

	var _loadLastTestExercise = function(){
		loadTestExercise(_currentTest.parsed_exercises.length);
	};

	var loadTestExercise = function(exerciseIndex){
		_currentExerciseIndex = exerciseIndex;
		var excercise = _currentTest.parsed_exercises[_currentExerciseIndex-1];
		_loadJSON(excercise);
		C.UI.updateTestMenuDialog();
	};

	var _isCurrentTestCompleted = function(){
		if(typeof _currentTest != "undefined"){
			for(var i=0; i<_currentTest.parsed_exercises.length; i++){
				if(_currentTest.parsed_exercises[i].progress.passed !== true){
					return false;
				}
			}
		} else {
			return false;
		}

		return true;
	};

	var onDoCurrentExercise = function(score,screenDOM){
		C.ProgressTracking.onDoCurrentExercise(score);

		if(typeof _currentTest != "undefined"){
			if(typeof _currentExercise != "undefined"){

				if(typeof _currentExercise.parsed_score_function != "function"){
					//Non graded exercise
					_currentExercise.progress.passed = true;
				} else {
					//Exercise with grading
					score = (typeof score === "number") ? score : 0;

					if(score >= 5){
						_currentExercise.progress.passed = true;

						if((_hasNextExercise())&&(!_getNextExercise().progress.passed)){
							var nextExerciseWrapper = $("<div class='nextExerciseButtonWrapper'><div class='nextExerciseButton'>" + C.I18n.getTrans("i.initNextExercise") + "</div></div>");
							if(typeof _currentExercise.parsed_score_function == "function"){
								$(screenDOM).find("div.overall_score").after(nextExerciseWrapper);
							}
							
							$(screenDOM).find(".nextExerciseButton").click(function(){
								_loadNextTestExercise();
							});
						} else {
							var testCompleted = _isCurrentTestCompleted();
							var messageWrapper;

							if(testCompleted){
								messageWrapper = $("<div class='nextExerciseButtonWrapper'><div class='nextExerciseButton'>" + C.I18n.getTrans("i.finishTest",{test: _currentTest.title}) + "</div></div>");
							} else {
								messageWrapper = $("<div class='nextExerciseButtonWrapper'><div class='nextExerciseButton'>" + C.I18n.getTrans("i.viewMoreExercises") + "</div></div>");
							}

							if(typeof _currentExercise.parsed_score_function == "function"){
								$(screenDOM).find("div.overall_score").after(messageWrapper);
							}

							if(!testCompleted){
								$(screenDOM).find(".nextExerciseButton").click(function(){
									$("#test_menu_wrapper").trigger("click");
								});
							}
						}
					}
				}

				C.UI.updateTestMenuDialog();
			}
		}
	};

	/* User management */
	var getUser = function(user){
		return _currentUser;
	};

	var setUser = function(user){
		if(typeof user == "object"){
			_currentUser = user;
			if(typeof _currentUser.name === "string"){
				$("#login").html(C.I18n.getTrans("i.loginAs",{name: _currentUser.name}));
				$("#login").show();
				$("ul.menu li.mitemmode").addClass("logged");
			}
		}
	};

	/* Debug */
	var isDebugging = function(){
		return _debug;
	};

	var isEditorMode = function(){
		return !_isViewer;
	};

	var isViewerMode = function(){
		return _isViewer;
	};


	/* Editor features */

	var _onChangeViewMode = function(oldViewMode,newViewMode){
		if((oldViewMode==="CODE")||(oldViewMode==="SCORE")){
			_saveCurrentJSON();
		}

		if(typeof _currentExercise != "undefined"){
			if(newViewMode==="CODE"){
				 _isScore = false;
				//Unlock editorMode in settings
				$("#settings_mode").removeAttr("disabled");
				_changeEditorMode(_currentExercise.editorMode,{initial_text: _currentExercise.content});
			} else if(newViewMode==="SCORE"){
				_isScore = true;
				var initialText = _currentExercise.score_function;
				if((typeof initialText != "string")||(initialText=="")){
					initialText = defaultValues["SCORE"][_currentExercise.editorMode];
				}
				//Block editorMode in settings
				$("#settings_mode").attr("disabled","disabled");
				_changeEditorMode("JavaScript",{preview_mode: _currentExercise.editorMode, initial_text: initialText});
			}
		}
	};

	var _isValidScoreFunctionValue = function(scoreFunctionText){
		if(typeof scoreFunctionText != "string"){
			return false;
		}
		if((scoreFunctionText.trim()==="")||(C.Utils.isCodeEmpty(scoreFunctionText))){
			return false;
		}
		for(var key in defaultValues["SCORE"]){
			if(scoreFunctionText === defaultValues["SCORE"][key]){
				return false;
			}
		}
		return true;
	};

	var _loadScorePanel = function(){
		//Populate vars
		var nVars = 0;
		$("#score_vars_select").html("");
		if((typeof _currentExercise != "undefined")&&(_currentExercise.score_function_vars instanceof Array)){
			nVars = _currentExercise.score_function_vars.length;
			for(var i=0; i<nVars; i++){
				var varName = _currentExercise.score_function_vars[i];
				var option = $('<option value="'+ varName +'">'+ varName + '</option>');
				$("#score_vars_select").prepend(option);
			}
		}
		if(nVars<1){
			$("#score_function_panel .codeditor_button[action='delete']").addClass("disabled");
			$("#score_vars_select").attr("disabled","disabled");
		} else {
			$("#score_function_panel .codeditor_button[action='delete']").removeClass("disabled");
			$("#score_vars_select").removeAttr("disabled");
		}

		$("#score_var_name_input").val("");
	};

	var _loadHTMLPanel = function(){
		var libs = _getAppliedLibraries(function(libs){
			$('#html_panel table.libraries input[type="checkbox"]').each(function(index,checkbox){
				var libname = $(checkbox).attr("value");
				if(libs.indexOf(libname)!==-1){
					$(checkbox).prop('checked', true);
				} else {
					$(checkbox).prop('checked', false);
				}
			});
		});
	};

	var _applyLibrary = function(library,enable,reload){
		if((_currentEditorMode!="HTML")||(typeof library != "string")){
			return;
		}

		if(typeof enable != "boolean"){
			enable = true;
		}

		if(typeof reload != "boolean"){
			reload = false;
		}

		var libs = _getAppliedLibraries(function(libs){
			_applyLibraryWithLibs(library,enable,reload,libs);
		});
	};

	var _applyLibraryWithLibs = function(library,enable,reload,libs){
		if(((enable)&&(libs.indexOf(library)!==-1))||((!enable)&&(libs.indexOf(library)===-1))){
			return;
		}

		var editorContent = _editor.getValue();
		
		var position = -1;
		var headIdentation = "      ";
		var i = headIdentation.length;
		while((position===-1)&&(i>=0)){
			position = editorContent.indexOf(headIdentation + "</head>");
			if(position===-1){
				i -= 1;
				headIdentation = headIdentation.replace(" ","");
			}
		}

		if(position===-1){
			C.Utils.showDialog(C.I18n.getTrans("i.librariesHeadRequired"));
			$('#html_panel table.libraries input[type="checkbox"][value="' + library + '"]').prop('checked', false);
			return;
		}

		var files = [];
		switch(library){
			case "jquery":
				files.push('<script libname="jquery" src="//code.jquery.com/jquery-1.11.2.min.js"></script>');
				break;
			case "zepto":
				files.push('<script libname="zepto" src="//cdnjs.cloudflare.com/ajax/libs/zepto/1.1.4/zepto.min.js"></script>');
				break;
			case "gmapsapi":
				files.push('<script libname="gmapsapi" src="//maps.googleapis.com/maps/api/js?sensor=true"></script>');
				break;
			case "gmaps":
				if((enable)&&(libs.indexOf("gmapsapi")===-1)&&(!reload)){
					_applyLibraryWithLibs("gmapsapi",true,false,libs);
					$('#html_panel table.libraries input[type="checkbox"][value="' + "gmapsapi" + '"]').prop('checked', true);
					_applyLibraryWithLibs("gmaps",true,true,libs);
					return;
				}
				files.push('<script libname="gmaps" src="//hpneo.github.io/gmaps/gmaps.js"></script>');
				break;
			case "bootstrap":
				if((enable)&&(libs.indexOf("jquery")===-1)&&(!reload)){
					_applyLibraryWithLibs("jquery",true,false,libs);
					$('#html_panel table.libraries input[type="checkbox"][value="' + "jquery" + '"]').prop('checked', true);
					_applyLibraryWithLibs("bootstrap",true,true,libs);
					return;
				}
				files.push('<link libname="bootstrap" rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">');
				files.push('<link libname="bootstrap" rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap-theme.min.css">');
				files.push('<script libname="bootstrap" src="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>');
			default:
				break;
		}

		var filesLength = files.length;
		if(filesLength===0){
			return;
		}

		var filesIdentation = headIdentation + "  ";
		var fullText = "";
		for(var i=0; i<filesLength; i++){
			fullText += filesIdentation + files[i] + "\n";
		}

		if(enable){
			editorContent = (editorContent.substr(0, position) + fullText + editorContent.substr(position));
		} else {
			editorContent = editorContent.replace(fullText,"");
			for(var i=0; i<filesLength; i++){
				var fullLine = filesIdentation + files[i] + "\n";
				editorContent = editorContent.replace(fullLine,"");
				editorContent = editorContent.replace(files[i],"");
			}
		}

		_editor.setValue(editorContent,1);
	};

	var _getAppliedLibraries = function(callback){
		var libs = [];

		if(_currentEditorMode!="HTML"){
			if(typeof callback==="function"){
				callback(libs);
			}
		}

		C.HTML.getHTMLdocument(_editor.getValue(),undefined,function(doc){
			$(doc).find("head > [libname]").each(function(index,el){
				var libname = $(el).attr("libname");
				if(libs.indexOf(libname)===-1){
					libs.push(libname);
				}
			});

			if(typeof callback==="function"){
				callback(libs);
			}
		});
	};

	var getPreview = function(){
		return getCurrentResource();
	};

	var createExercise = function(){
		var exercise = {};
		exercise.type = "exercise";
		exercise.title = "";
		exercise.description = "";
		exercise.editorMode = "JavaScript";
		exercise.content = "";
		var exercises = JSON.parse(_currentTest.exercises);
		exercises.push(exercise);
		_currentTest.exercises = JSON.stringify(exercises);

		if(_isValidJSON(_currentTest)){
			if($("#test_exercises_dialog").dialog("isOpen")){
				$("#test_exercises_dialog").dialog("close");
			}
			_loadJSON(_currentTest);
			_loadLastTestExercise();
		}
	};

	var _updateCurrentTestWithCurrentExercise = function(){
		var exercises = JSON.parse(_currentTest.exercises);
		exercises[_currentExerciseIndex-1] = _currentExercise;
		_currentTest.exercises = JSON.stringify(exercises);
	};

	var deleteExercise = function(exerciseIndex){
		var exercises = JSON.parse(_currentTest.exercises);
		exercises.splice(exerciseIndex-1,1);
		_currentTest.exercises = JSON.stringify(exercises);
		var errors = _validateJSON(_currentTest,{updateCurrent: true});

		if(errors.length === 0){
			if(exerciseIndex===_currentExerciseIndex){
				//Delete current
				loadTestExercise(1);
			} else {
				if(exerciseIndex < _currentExerciseIndex){
					_currentExerciseIndex -= 1;
				}
				C.UI.updateTestMenuDialog();
			}
		}
	};

	var moveExercise = function(oldExerciseIndex,newExerciseIndex){
		if(oldExerciseIndex!=newExerciseIndex){
			var exercises = JSON.parse(_currentTest.exercises);
			CODEditor.Utils.moveElementInArray(exercises,oldExerciseIndex-1,newExerciseIndex-1);
			_currentTest.exercises = JSON.stringify(exercises);
			var errors = _validateJSON(_currentTest,{updateCurrent: true});
			if(errors.length === 0){
				//Update _currentExerciseIndex
				if(_currentExerciseIndex===oldExerciseIndex){
					_currentExerciseIndex = newExerciseIndex;
				} else {
					if((_currentExerciseIndex<oldExerciseIndex)&&(_currentExerciseIndex >= newExerciseIndex)){
						_currentExerciseIndex += 1;
					} else if((_currentExerciseIndex>oldExerciseIndex)&&(_currentExerciseIndex <= newExerciseIndex)){
						_currentExerciseIndex -= 1;
					}
				}
			}
		}
	};

	var _addScoreVar = function(varName){
		if((typeof varName != "string")||(varName.trim() === "")){
			return;
		}
		if(!(_currentExercise.score_function_vars instanceof Array)){
			_currentExercise.score_function_vars = [];
		}
		if(_currentExercise.score_function_vars.indexOf(varName)===-1){
			_currentExercise.score_function_vars.push(varName);
			_validateJSON(_currentExercise,{updateCurrent: true});
		}
	};

	var _removeScoreVar = function(varName){
		if(_currentExercise.score_function_vars instanceof Array){
			if(_currentExercise.score_function_vars.indexOf(varName)!=-1){
				_currentExercise.score_function_vars.splice(_currentExercise.score_function_vars.indexOf(varName),1);
				_validateJSON(_currentExercise,{updateCurrent: true});
			}
		}
	};

	var _inferScoreFunctionVars = function(){
		var detectedVars = [];
		var matches = _currentExercise.score_function.match(/variablesHash\["([aA-zZ0-9]+)"\]/g);
		if(matches instanceof Array){
			var matchesLength = matches.length;
			for(var i=0; i<matchesLength; i++){
				if(typeof matches[i] == "string"){
					var match = /variablesHash\["([aA-zZ0-9]+)"\]/g.exec(matches[i]);
					if((match instanceof Array)&&(match.length === 2)&&(typeof match[1] == "string")){
						detectedVars.push(match[1]);
					}
				}
			}

			var dVL = detectedVars.length;
			for(var j=0; j<dVL; j++){
				_addScoreVar(detectedVars[j]);
			}
		}
	};

	var _hasResourceChanged = function(){
		_saveCurrentJSON({raise_errors: false});
		var currentResource = getCurrentResource();
		if((typeof _lastSavedResource == "undefined")||(typeof currentResource == "undefined")){
			return (!_isEmptyResource(currentResource));
		}
		return (_lastSavedResource!==JSON.stringify(currentResource));
	};

	var _isEmptyResource = function(resource){
		if(typeof resource !== "object"){
			return true;
		}

		try {
			var commonFieldsEmpty = ((resource.title.trim()==="")&&((typeof resource.description == "undefined")||(resource.description.trim()===""))&&((typeof resource.metadata != "object")||(Object.keys(resource.metadata).length<2)));
			switch(resource.type){
				case "exercise":
					if((commonFieldsEmpty)&&(resource.content.trim()==="")&&(typeof resource.parsed_score_function == "undefined")&&(typeof resource.score_function == "undefined")){
						return true;
					}
					break;
				case "test":
					if((commonFieldsEmpty)&&((typeof resource.parsed_exercises == "undefined")||(resource.parsed_exercises.length===1))&&(_isEmptyResource(resource.parsed_exercises[0]))){
						return true;
					}
					break;
				default:
					break;
			}
		} catch (e){}

		return false;
	};

	return {
		init 					: init,
		isEditorMode			: isEditorMode,
		isViewerMode			: isViewerMode,
		getCurrentViewMode		: getCurrentViewMode,
		getCurrentEditorMode 	: getCurrentEditorMode,
		getCurrentEditorTheme	: getCurrentEditorTheme,
		getEditor 				: getEditor,
		getCurrentTest			: getCurrentTest,
		getCurrentExercise 		: getCurrentExercise,
		getCurrentExerciseIndex	: getCurrentExerciseIndex,
		getCurrentResource 		: getCurrentResource,
		getCurrentResourceTitle : getCurrentResourceTitle,
		loadTestExercise		: loadTestExercise,
		exportToSCORM			: exportToSCORM,
		onDoCurrentExercise		: onDoCurrentExercise,
		getUser					: getUser,
		setUser					: setUser,
		getPreview				: getPreview,
		createExercise			: createExercise,
		deleteExercise			: deleteExercise,
		moveExercise			: moveExercise,
		isDebugging				: isDebugging
	};

}) (CODEditor,jQuery);