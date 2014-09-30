/*global window: false, REDIPS: true, document, $, Dragdealer, ddSliders */
/*jshint globalstrict: true*/
/* enable strict mode */
"use strict";

$(document).ready(function() {
	var redipsInit,			// define redipsInit
		getContent,			// get content (DIV elements in TD)
		divNodeList,		// node list of DIV elements in table2 (global variable needed in report() and visibility() function)
		lspine = {},		// main function container
		ddLevelEnabled = [false, false, false, false, false],	// keep track of which levels have initialized ddSliders
		ddSliderTypes =
			[
			'ddAf',
			'ddDd',
			'ddEp',
			'ddFjhR',
			'ddFjhL',
			'ddLft',
			'ddL'
			],
		ddSliderText =
			{
			'ddAf': 'annular fissure',
			'ddDd': 'disc desiccation',
			'ddEp': 'end-plate degenerative changes',
			'ddFjhR': 'right facet joint hypertrophy',
			'ddFjhL': 'left facet joint hypertrophy',
			'ddLft': 'ligamentum flavum thickening',
			'ddL': 'listhesis'
			};
	lspine.helpers = {};
	window.ddSliders = {};	// set ddSliders as a global container of sliders

	// redips initialization
	redipsInit = function () {
		var	rd = REDIPS.drag;			// reference to the REDIPS.drag object
		// initialization
		rd.init();
		// REDIPS.drag settings
		rd.dropMode = 'overwrite';
		rd.hover.colorTd = '#9BB3DA';	// set hover color
		rd.clone.keyDiv = true;			// enable cloning DIV elements with pressed SHIFT key
		// prepare node list of DIV elements in table2
		divNodeList = document.getElementById('table2').getElementsByTagName('div');

		lspine.update();	// update on initialization

		rd.event.deleted = function () {
			lspine.update();	// update on deleting DIV
		};

		// element is dropped
		rd.event.dropped = function () {
			var	objOld = rd.objOld,					// original object
				targetCell = rd.td.target,			// target cell
				targetRow = targetCell.parentNode,	// target row
				i,									// local variables
				objNew;
			// if checkbox is checked and original element is of clone type then clone spread throughout the level
			if (document.getElementById('entirelevel').checked === true && objOld.className.indexOf('clone') > -1) {
				// loop through table cells (LINK [formerly BBDB] checkbox)
				// for (i = 0; i < targetRow.cells.length; i++) {
				for (i = 4; i <= 6; i++) {
					// skip cell if cell has some content (first column is not empty because it contains label)
					if (targetRow.cells[i].childNodes.length > 0) {
						continue;
					}
					// clone DIV element
					objNew = rd.cloneObject(objOld);
					// append to the table cell
					targetRow.cells[i].appendChild(objNew);
				}
			}
			lspine.update();	// update on dropping a DIV in a TD
		};
	};

	// get content (DIV elements in a specific TD) [ex27]
	getContent = function (id) {
		var td = document.getElementById(id),
			content = '',
			cn,
			i;
		// TD can contain many DIV elements
		for (i = 0; i < td.childNodes.length; i++) {
			// set reference to the child node
			cn = td.childNodes[i];
			// childNode should be DIV with containing "drag" class name
			if (cn.nodeName === 'DIV' && cn.className.indexOf('drag') > -1) { // and yes, it should be uppercase
				// append DIV id to the result string
				content += cn.id + '_';
			}

			// 7/24/14
			// cn.className.indexOf('bl') == 5 if cell contains the editable DIV (w/ input box)
			// cn.id is the ID of the DIV
			// cells contain DIVs, which contain INPUT
			// http://stackoverflow.com/questions/3586305/get-all-input-fields-inside-div-without-js-library

			// return INPUT value if the editable DIV named 'bl' is found
			if (cn.className.indexOf('bl') === 5) {
				return document.getElementById(cn.id).getElementsByTagName('input')[0].value;
			}

		}

		// 7/18/14 get rid of the trailing "_c0"
		content = content.substring(0, content.length - 3);
		return content;
	};

	// ========================== //
	// ====== lspine.update ===== //
	// ========================== //
	lspine.update = function () {
		//===DEFINE VARIABLES===//
		var report_text, i, levels_text = [], h_text = [], n_text = [], s_text = [], o_text = [], b_text = [], curlevel, n_sev = [], s_sev, b_sev = [], other = [], p_text = [], concl = '',

		// IDs of right table cells. first row blank so that levels[1] = L1-2 level
		levels =
			[
			' / / / / '.split('/'),
			'n11 r11 r12 r13 r14 r15 r16 r17 n12 s1'.split(' '),	// L1-2
			'n21 r21 r22 r23 r24 r25 r26 r27 n22 s2'.split(' '),	// L2-3
			'n31 r31 r32 r33 r34 r35 r36 r37 n32 s3'.split(' '),	// L3-4
			'n41 r41 r42 r43 r44 r45 r46 r47 n42 s4'.split(' '),	// L4-5
			'n51 r51 r52 r53 r54 r55 r56 r57 n52 s5'.split(' ')	// L5-S1
			],

		// IDs of right table 'BBDB' cells - combine with var levels eventually?
		b_levels = ' /b1/b2/b3/b4/b5'.split('/'),

		// first col blank so that plocations[1] = 'R foraminal' (skipping 'R NF narrowing')
		plocations =
			[
			'',
			'right foraminal',
			'right subarticular',
			'right central',
			'central',
			'left central',
			'left subarticular',
			'left foraminal'
			],

		// NFN locations
		nlocations = ['right','left'];


		//===INITIALIZATION===//
		for (i = 1; i <= 5; i++) {
			b_text[i] = '';
			h_text[i] = '';
			n_text[i] = '';
			s_text[i] = 'no spinal canal stenosis.';
			o_text[i] = '';
		}


		//===CYCLE THROUGH DISC SPACES===//
		for (curlevel = 1; curlevel <= 5; curlevel++) {

			// DISC HERNIATIONS //
			// BBDB
			b_sev = getContent(b_levels[curlevel]);
			if (b_sev) {
				b_text[curlevel] = 'is a ' + b_sev + ' broad-based disc bulge';
			}

			// protrusions
			p_text = [];
			for(i = 1; i <= 7; i++) {
				if (getContent(levels[curlevel][i])) {
					p_text[p_text.length] = getContent(levels[curlevel][i]) + ' ' + plocations[i];
				}
			}

			// consolidate protrusions into a comma-separated phrase
			switch(p_text.length) {
				case 0:
					h_text[curlevel] = '';
					break;
				case 1:
					h_text[curlevel] = ' is a ' + p_text + ' disc protrusion';
					if (b_sev) {
						h_text[curlevel] = 'a ' + p_text + ' disc protrusion';
					}
					break;
				case 2:
					h_text[curlevel] = 'are ' + p_text.join(' and ') + ' disc protrusions';
					if (b_sev) {
						h_text[curlevel] = p_text.join(' and ') + ' disc protrusions';
					}
					break;
				default:
					h_text[curlevel] = 'are ' + p_text.join(', ') + ' disc protrusions';
					if (b_sev) {
						h_text[curlevel] = p_text.join(', ') + ' disc protrusions';
					}
			}

			// combine BBDB and protrusion into one sentence
			if(h_text[curlevel] === '') {
				if(b_text[curlevel] === '') {	// no protrusion, no bulge
					h_text[curlevel] = 'is no disc bulge or protrusion';
				} else {	// no protrusion, + bulge
					h_text[curlevel] = b_text[curlevel];
				}
			} else {
				if(b_text[curlevel]) {	// + protrusion, + bulge
					h_text[curlevel] = b_text[curlevel] + ' and ' + h_text[curlevel];
				} else { // + protrusion, no bulge
					// h_text already contains protrusion text!
				}
			}


			// NEUROFORAMINAL NARROWING //
			var n_temp = [];
			for(i = 0; i <= 1; i++) {
				n_sev[i] = getContent(levels[curlevel][8*i]).replace(/c[0-9]/g, '');

				if (n_sev[i]) {
					n_temp[n_temp.length] = getContent(levels[curlevel][8*i]) + ' ' + nlocations[i];
				}

				// consolidate NFNs into a phrase
				switch (n_temp.length) {
					case 0:
						n_text[curlevel] = 'no';
						break;
					case 1:
						n_text[curlevel] = n_temp;
						break;
					case 2:
						n_text[curlevel] = n_temp.join(' and ');
						// combine 'X right and X left NFN' into 'X bilateral NFN'
						if (n_sev[0] === n_sev[1] && n_sev[0]) {
							n_text[curlevel] = n_sev[0] + ' bilateral';
						}
						break;
				}
				n_text[curlevel] += ' neuroforaminal narrowing';
			}


			// SPINAL CANAL STENOSIS //
			s_sev = getContent(levels[curlevel][9]);
			if (s_sev) {
				s_text[curlevel] = s_sev + ' spinal canal stenosis.';
			}


			// OTHER COLUMN //
			for (i = 0; i <= ddSliderTypes.length; i++) {	// cycle through all sliders at each level
				var curSlider = ddSliders[ddSliderTypes[i] + curlevel.toString()];
				if (curSlider) {
					var curSliderText = $('#' + ddSliderTypes[i] + curlevel.toString() + '_handle').text();
					if (curSliderText != 'None') {
						o_text[curlevel] +=
							' ' + $('#' + ddSliderTypes[i] + curlevel.toString() + '_handle').text() +
							' ' + ddSliderText[ddSliderTypes[i]] + '. ';
					}
				}
			}


			// STRING MANIPULATION
			o_text[curlevel] = o_text[curlevel].replace(/facet joint hypertrophy, (\w+)\b/ig, '$1 facet joint hypertrophy');
			o_text[curlevel] = o_text[curlevel].replace(/\b(\w+) right.*\1 left/i, '$1 bilateral');
			o_text[curlevel] = o_text[curlevel].replace(/\. right facet joint hypertrophy. Left/i, '. Bilateral');
			o_text[curlevel] = o_text[curlevel].replace(/ facet joint hypertrophy. (.*) facet/, ' and $1 facet');
			o_text[curlevel] = o_text[curlevel].replace(/\. right and (.*) left facet/i, '. $1 bilateral facet');
			o_text[curlevel] = o_text[curlevel].replace(/right and left /i, 'bilateral ');
			o_text[curlevel] = o_text[curlevel].replace(/(i+-?i*) (\w+listhesis)/ig, 'Grade $1 $2');
			o_text[curlevel] = o_text[curlevel].replace(/sev/ig, 'severe');
			o_text[curlevel] = o_text[curlevel].replace(/mod/ig, 'moderate');
			o_text[curlevel] = o_text[curlevel].replace(/Gr ([0-9])/, 'Grade $1');
			o_text[curlevel] = o_text[curlevel].replace(/o list/, 'olist');

		} // END OF CYCLE THROUGH DISC LEVELS


		// ===== CONCLUSION SENTENCE ===== //
		if (!document.getElementById('conclusion').checked) {
			concl = '';	// blank conclusion sentence if checkbox is unchecked
		} else {
			var refsevs = 'mild mild-moderate moderate moderate-severe severe'.split(' '),
				lumbarlevels = ' L1-2 L2-3 L3-4 L4-5 L5-S1'.split(' '),
				n_sevs = [], s_sevs = [], high_sev, high_sev_level = [], cl, s_match = false;

			// get a list of SS + NFN severities, removing clone c*
			for(i = 1; i <= 5; i++) {
				s_sevs[i] = getContent(levels[i][7]).replace(/c[0-9]/g, '');
				n_sevs[i] = getContent(levels[i][0]).replace(/c[0-9]/g, '');
				n_sevs[i + 5] = getContent(levels[i][6]).replace(/c[0-9]/g, '');
			}

			// priority: 1) highest severity. 2) favor SS over NF when enumerating levels
			for(i = 4; i >= 0; i--) {					// iterate backwards from most severe
				if (s_sevs.indexOf(refsevs[i]) > -1) {	// if there is an SS match ...
					for(cl = 1; cl <= 5; cl++) {		// ... look through all levels ...
						if (getContent(levels[cl][7]).replace(/c[0-9]/g, '') === refsevs[i]) {	// ... if there are other levels with equivalent SS severities
							high_sev_level[high_sev_level.length] = lumbarlevels[cl];	// ... store them too
						}
					}
					high_sev = refsevs[i];
					i = -1;	// exit loop. if there is a match, don't look for lower severity matches
					s_match = true;
				}

				if (n_sevs.indexOf(refsevs[i]) > -1 && !s_match) {	// if there is an NFN match but no SS match...
					for(cl = 1; cl <= 5; cl++) {		// ... look through all levels ...
						if (getContent(levels[cl][0]).replace(/c[0-9]/g, '') === refsevs[i] || getContent(levels[cl][6]).replace(/c[0-9]/g, '') === refsevs[i]) {	// ... if there are other levels with equivalent NFN severities
							high_sev_level[high_sev_level.length] = lumbarlevels[cl];	// ... store them too
						}
					}
					high_sev = refsevs[i];
					i = -1;	// exit loop. if there is a match, don't look for lower severity matches
				}
			}

			// list the levels where highest severity is present
			if (high_sev) {
				switch(high_sev_level.length) {
					case 1:
						concl = high_sev_level + ' level.';	// maybe this converts it to a string
						break;
					case 2:
						concl = high_sev_level.join(' and ') + ' levels.';
						break;
					default:
						concl = high_sev_level.join(', ') + ' levels.';
				}

				concl = concl.replace(/-(\d).*\1/g, '');	// combine Lx-y and Ly-z → Lx-z

				// generate conclusion sentence
				concl =
					lspine.helpers.capitalizer(high_sev) +
					(
						high_sev_level.length < 3 ?
							' lumbar spondylosis, particularly at the ' +
							concl.replace(/,(?=[^,]*$)/, ', and')
						:
							' multi-level lumbar spondylosis as described above.'
					) +
					'<br><br>'
					;

			} else {
				concl = 'No significant degenerative change.<br><br>';
			}
			concl = '<b>CONCLUSION:</b><br>' + concl;
		}


		// ===== GENERATE SENTENCE FOR EACH LEVEL ===== //
		for (i = 1; i <= 5; i++) {
			// add 'and' and oxford commas
			h_text[i] = h_text[i].replace(/,(?=[^,]*$)/, ', and');

			// combine sentences
			levels_text[i] = h_text[i] + '. ' + n_text[i] + '. ' + s_text[i] + o_text[i];

			// remove clones' 'c#'
			levels_text[i] = levels_text[i].replace(/c[0-9]/g, '');

			// toLowerCase() first to include editable DIV, then apply sentence case
			levels_text[i] = lspine.helpers.capitalizer(levels_text[i].toLowerCase());

			// fixes for listheses
			levels_text[i] = levels_text[i].replace(/ (i+-?i*) /ig, String.call.bind(levels_text[1].toUpperCase));
			levels_text[i] = levels_text[i].replace(/(\. [^\.]*listhesis)/g, '$1 of L' + i + ' on L' + (i + 1));
			levels_text[i] = levels_text[i].replace(/L6/g, 'S1');

			// convert first letter to lowercase because text starts with "There "
			levels_text[i] = levels_text[i].substring(0, 1).toLowerCase() + levels_text[i].substring(1);
		}

		// ===== GLOBAL TEXT ===== //
		var global_text = '';
		if ($('#mild-spon').is(':checked')) {
			global_text = '<br><br>Mild spondylosis throughout.';
		}
		if ($('#mod-spon').is(':checked')) {
			global_text = '<br><br>Moderate spondylosis throughout.';
		}
		if ($('#sev-spon').is(':checked')) {
			global_text = '<br><br>Severe spondylosis throughout.';
		}
		if ($('#mild-spon').is(':checked') && $('#mod-spon').is(':checked')) {
			global_text = '<br><br>Mild-moderate spondylosis throughout.';
		}
		if ($('#mod-spon').is(':checked') && $('#sev-spon').is(':checked')) {
			global_text = '<br><br>Moderate-severe spondylosis throughout.';
		}
		if ($('#mild-spon').is(':checked') && $('#mod-spon').is(':checked') && $('#sev-spon').is(':checked')) {
			global_text = '<br><br>Lumbar spondylosis throughout.';
		}
		if ($('#mild-spon').is(':checked') && $('#sev-spon').is(':checked')) {
			global_text = '<br><br>Lumbar spondylosis throughout.';
		}
		levels_text[5] += global_text;

		// ===== ADD TALKSTATION [BRACKETS] ===== //
		if (document.getElementById('talk-brackets').checked) {	// make sure checkbox is checked
			for (i = 1; i <= 5; i++) {
				// add [brackets] to main report for easier editing in Talk
				levels_text[i] = levels_text[i].replace(/(mild|moderate|severe|minimal|no disc bulge or protrusion.|No neuroforaminal narrowing\.|No spinal canal stenosis\.)/ig, '[$1]');
				levels_text[i] = levels_text[i].replace(/(\[mild\]-\[moderate\]|\[moderate\]-\[severe\]|\[mild\]-\[severe\])/ig, '[$1]');
				levels_text[i] = levels_text[i].replace(/Grade ([0-9])/i, 'Grade [$1]');
			}

			// add [brackets] to conclusion sentence for easier editing in Talk
			if (concl) {
				concl = concl.replace(/b><br>(.*\.)<br>/igm, 'b><br> [$1]<br>');
			}
		}


		// ===== GENERATE REPORT ====== //
		report_text =	'<b>L1-L2</b>: There ' + levels_text[1] + '<br>' +
						'<b>L2-L3</b>: There ' + levels_text[2] + '<br>' +
						'<b>L3-L4</b>: There ' + levels_text[3] + '<br>' +
						'<b>L4-L5</b>: There ' + levels_text[4] + '<br>' +
						'<b>L5-S1</b>: There ' + levels_text[5] +
						'<br><br>' +
						concl;


		// ===== UPDATE REPORT PREVIEW ===== //
		document.getElementById('report_textarea').innerHTML = report_text;
	};

	// ===== SELECT ALL BUTTON ===== //
	lspine.selectAll = function() {
		document.getElementById('report_textarea').focus();
		document.execCommand('SelectAll');
	};

	// ===== RESET BUTTON ===== //
	lspine.reset = function() {
		var i, j, allLevelCBs = ['mild-spon', 'mod-spon', 'sev-spon'],
		table =
			[
			'b1 n11 r11 r12 r13 r14 r15 r16 r17 n12 s1 #o1'.split(' '),	// L1-2
			'b2 n21 r21 r22 r23 r24 r25 r26 r27 n22 s2 #o2'.split(' '),	// L2-3
			'b3 n31 r31 r32 r33 r34 r35 r36 r37 n32 s3 #o3'.split(' '),	// L3-4
			'b4 n41 r41 r42 r43 r44 r45 r46 r47 n42 s4 #o4'.split(' '),	// L4-5
			'b5 n51 r51 r52 r53 r54 r55 r56 r57 n52 s5 #o5'.split(' ')		// L5-S1
			];

		for (i = 0; i < 5; i++) {
			// clear main table
			for (j = 0; j < 11; j++) {
				REDIPS.drag.emptyCell(document.getElementById(table[i][j]));
			}

			if (ddLevelEnabled[parseInt(i + 1)]) {	// check if level is initialized, else will get error
				// reset sliders to 'none'
				for (j = 0; j < ddSliderTypes.length - 1; j++) {
					ddSliders[ddSliderTypes[j] + parseInt(i + 1)].setValue(0, 0, true);
				}
				// reset -listhesis to 'none'
				ddSliders[ddSliderTypes[ddSliderTypes.length - 1] + parseInt(i + 1)].setValue(0.5, 0, true);
			}
		}

		for (i = 0; i < allLevelCBs.length; i++) {
			document.getElementById(allLevelCBs[i]).checked = false;	// clear "all levels" checkboxes
		}

		lspine.update();
	};

	// ===== CAPITALIZE FIRST LETTER OF SENTENCE ===== //
	lspine.helpers.capitalizer = function(myString) {
		return myString.replace(/(^\w{1}|\.\s*\w{1})/gi, function(toReplace) {
			return toReplace.toUpperCase();
		});
	};

	// initialize 'instructions' / 'quick ref' Colorboxes
	$('a.cb').colorbox({
		opacity: 0.5,
		width: "750px",
		height: "350px"
	});

	// initialize 'Other findings' Colorbox
	$('.inline').colorbox({
		inline: true,
		width: "280px",
		height: "540px",
		opacity: 0.4,
		speed: 0,
		left: "700px",
		top: "50px",
		onComplete:function() {
			var curlevel = this.id.substring(2);	// this.id = 'of2'

			if (!ddLevelEnabled[parseInt(curlevel)]) {
				ddInit(curlevel);						// initialize ddSliders at curlevel if not already done
				ddLevelEnabled[parseInt(curlevel)] = true;	// only do it once per session so values aren't lost
			}
		}
	});

	// initialize ddSliders
	var ddInit = function(curlevel) {	// called by $('.inline').colorbox
		// if not yet done, initialize Dragdealers at this level
		var i = 0,
			ddSliderSevs = 'None Mild Mod Sev'.split(' '),
			n = ddSliderSevs.length - 1;

		ddSliders['ddAf' + curlevel] = new Dragdealer('ddAf' + curlevel,
			{
				steps: 4,
				snap: false,
				animationCallback: function(x, y) {
					$('#ddAf' + curlevel + '_handle').html(ddSliderSevs[Math.floor((x + (1/(2*n))) * n)]);
					$('#ddAf' + curlevel + '_handle').css("background-color", "rgb(255, " + parseInt(305*(1-x)) + ", " + parseInt(305*(1-x)) + ")");
					lspine.update();
				}
			});

		ddSliders['ddDd' + curlevel] = new Dragdealer('ddDd' + curlevel,
			{
				steps: 4,
				snap: false,
				animationCallback: function(x, y) {
					$('#ddDd' + curlevel + '_handle').html(ddSliderSevs[Math.floor((x + (1/(2*n))) * n)]);
					$('#ddDd' + curlevel + '_handle').css("background-color", "rgb(255, " + parseInt(305*(1-x)) + ", " + parseInt(305*(1-x)) + ")");
					lspine.update();
				}
			});

		ddSliders['ddEp' + curlevel] = new Dragdealer('ddEp' + curlevel,
			{
				steps: 4,
				snap: false,
				animationCallback: function(x, y) {
					$('#ddEp' + curlevel + '_handle').html(ddSliderSevs[Math.floor((x + (1/(2*n))) * n)]);
					$('#ddEp' + curlevel + '_handle').css("background-color", "rgb(255, " + parseInt(305*(1-x)) + ", " + parseInt(305*(1-x)) + ")");
					lspine.update();
				}
			});

		ddSliders['ddFjhR' + curlevel] = new Dragdealer('ddFjhR' + curlevel,
			{
				steps: 4,
				snap: false,
				animationCallback: function(x, y) {
					$('#ddFjhR' + curlevel + '_handle').html(ddSliderSevs[Math.floor((x + (1/(2*n))) * n)]);
					$('#ddFjhR' + curlevel + '_handle').css("background-color", "rgb(255, " + parseInt(305*(1-x)) + ", " + parseInt(305*(1-x)) + ")");
					lspine.update();
				}
			});

		ddSliders['ddFjhL' + curlevel] = new Dragdealer('ddFjhL' + curlevel,
			{
				steps: 4,
				snap: false,
				animationCallback: function(x, y) {
					$('#ddFjhL' + curlevel + '_handle').html(ddSliderSevs[Math.floor((x + (1/(2*n))) * n)]);
					$('#ddFjhL' + curlevel + '_handle').css("background-color", "rgb(255, " + parseInt(305*(1-x)) + ", " + parseInt(305*(1-x)) + ")");
					lspine.update();
				}
			});

		ddSliders['ddLft' + curlevel] = new Dragdealer('ddLft' + curlevel,
			{
				steps: 4,
				snap: false,
				animationCallback: function(x, y) {
					$('#ddLft' + curlevel + '_handle').html(ddSliderSevs[Math.floor((x + (1/(2*n))) * n)]);
					$('#ddLft' + curlevel + '_handle').css("background-color", "rgb(255, " + parseInt(305*(1-x)) + ", " + parseInt(305*(1-x)) + ")");
					lspine.update();
				}
			});

		ddSliders['ddL' + curlevel] = new Dragdealer('ddL' + curlevel,
			{
				steps: 7,
				snap: false,
				x: 0.5,
				animationCallback: function(x, y) {
					var ddLSevs = 'Gr 3 Antero|Gr 2 Antero|Gr 1 Antero|None|Gr 1 Retro|Gr 2 Retro|Gr 3 Retro'.split('|'),
					nL = ddLSevs.length - 1;
					var rgb = [];
					$('#ddL' + curlevel + '_handle').html(ddLSevs[Math.floor((x + (1/(2*nL))) * nL)]);
					switch(true) {
						case (x < 0.5):
							rgb = [41 + 428*x, 128 + 254*x, 185 + 140*x];
							break;
						case (x === 0.5):
							rgb = [255, 255, 255];
							break;
						case (x > 0.5):
							rgb = [255 - 126*(x-0.5), 255 - 396*(x-0.5), 255 - 424*(x-0.5)];
							break;
					}
					$('#ddL' + curlevel + '_handle').css('background-color', 'rgb(' + parseInt(rgb[0]) + ', ' + parseInt(rgb[1]) + ', ' + parseInt(rgb[2]) + ')');
					lspine.update();
				}
			});

		// ddLevelEnabled[parseInt(curlevel)] = true;
	};

	$('body').on('keyup', '.bl_text_class', function() {
		lspine.update();
	});

	$('#conclusion, #talk-brackets, #mild-spon, #mod-spon, #sev-spon').click(function() {
		lspine.update();
	});

	$('#resetbtn').click(function() {
		lspine.reset();
	});

	$('#selectAllbtn').click(function() {
		lspine.selectAll();
	});

	// hover over first row labels to display reference image
	$(".hover").hover(
		//hover() fn 1 = onmouseover
		function (e) {
			var imageFilenames =
				{
					"Broad-based disc bulge"			: "bbdb",
					"Right foraminal disc protrusion"	: "rfdp",
					"Right subarticular disc protrusion": "rsadp",
					"Right central disc protrusion"		: "rcdp",
					"Central disc protrusion"			: "cdp",
					"Left central disc protrusion"		: "lcdp",
					"Left subarticular disc protrusion"	: "lsadp",
					"Left foraminal disc protrusion"	: "lfdp"
				};

			$("body").append(
				"<p id='hoverImage'><img src='img/" +
				imageFilenames[this.title] +
				".jpg'/></p>");
			$("#hoverImage")
				.css("position", "absolute")
				.css("top", (e.pageY - 15) + "px")
				.css("left", (e.pageX - 50) + "px")
				.css("transform", "scale(0.75)")
				.fadeIn("fast");
		},
		// hover() fn 2 = onmouseout
		function () {
			$("#hoverImage").remove();
		});

	// reference images follow mouse cursor
	$(".hover").mousemove(function (e) {
		$("#hoverImage")
			.css("top", (e.pageY - 15) + "px")
			.css("left", (e.pageX - 20) + "px");
	});

	redipsInit();
});
