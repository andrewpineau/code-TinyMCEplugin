/**
 *   plugin.js AKA Code Plugin Plus Plus
 *
 *   Copyright (C) 2016 Andrew Pineau
 *   Released under LGPL License.
 * 
 *   This plugin is free software; you can redistribute it and/or
 *   modify it under the terms of the GNU Lesser General Public
 *   License as published by the Free Software Foundation; either
 *   version 2.1 of the License, or (at your option) any later version.
 *
 *   This plugin is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *   Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public
 *   License along with this plugin; if not, write to the Free Software
 *   Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 *
 *Purpose:
 *  This plugin builds on the original 'code' plugin for TinyMCE released by Ephox Corp. 
 *  In the original version, when you submit invalid html, it is reformatted to be valid. 
 *  This can cause major undesired changes in your html. This version of the code plugin 
 *  alerts you when your html is invalid rather than automatically fixing it. You then have 
 *  the option to try to fix the html your way or submit it anyway.
 */

/*global tinymce:true */
tinymce.PluginManager.add('code', function (editor) {
    function showDialog() {
        var win = editor.windowManager.open({
            title: "Source code",
            body: {
                type: 'textbox',
                name: 'code',
                multiline: true,
                minWidth: editor.getParam("code_dialog_width", 900),
                minHeight: editor.getParam("code_dialog_height", Math.min(tinymce.DOM.getViewPort().h - 200, 500)),
                spellcheck: false,
                style: 'direction: ltr; text-align: left',
                id: 'code'
            },
            onSubmit: function (e) {
                //Calling e.preventDefault prevents the code editing window from cliosing by default
                e.preventDefault();

                if (ValidateCode(e.data.code)) {
                    //if html valid, submit it to tinyMCE 
                    submitCode(e);
                    win.close();
                }
                else
                {
                    //If html invalid, display message to the user alerting them. The user has the option to try fixing the html or submitting it anyway.
                    tinyMCE.activeEditor.windowManager.confirm("Your HTML may be invalid and reconfigured to be valid if you submit it as it is. Would you like to submit it any way.", function (s) {
                        if (s) {
                            submitCode(e);
                            win.close();
                        }
                        else {
                            return;
                        }
                    });
                }
                //function to send code to TinyMCE(this is the body of the original onSubmit function)
                function submitCode(e) {
                    editor.focus();
                    editor.undoManager.transact(function () {
                        editor.setContent(e.data.code);
                    });
                    editor.selection.setCursorLocation();
                    editor.nodeChanged();
                }

            }

        });

        win.find('#code').value(editor.getContent({ source_view: true }));
    }

    //function to check if submitted code is valid
    function ValidateCode(code) {
        var isCodeValid = true;
        
        //this variable holds a copy of the html string with required outer tags prepended and appended
        var htmlDoc = "<head></head><body>" + code + "</body>";
        console.log('orig: ' + htmlDoc);

        //remove final slash of self-closing tags (refactor to a sinlgle method). This is done because when we generate a DOM from the string, it removes these slashes.
        htmlDoc = FixSelfClosingTags(htmlDoc);

        //remove all html codes enclosed in ampersand and colon since some will be rendered as the actual character when we generate the DOM
        htmlDoc = htmlDoc.replace(new RegExp("&[a-zA-z0-9#]*;", "g"), ""); 

        //Remove extra spaces in tags.
        htmlDoc = htmlDoc.replace(/  +/g, " ");
        htmlDoc = htmlDoc.replace(/< /g, "<");
        htmlDoc = htmlDoc.replace(/ >/g, ">");

        //Create DOM from string which will correct mistakes if any.
        var parser = new DOMParser();
        var DOM = parser.parseFromString(htmlDoc, "text/html");
        console.log('doc1: ' + htmlDoc);
        console.log('doc2: ' + DOM.documentElement.innerHTML);

        //if the generated DOM string and htmlDoc string are not equal, it means something was changed when converting htmlDoc to a DOM and, thus, the users code is invalid is invalid.
        if (DOM.documentElement.innerHTML != htmlDoc) {
            isCodeValid = false;
        }

        return isCodeValid;
    }

    //removes all final slashes from self-closing tags
    function FixSelfClosingTags(doc)
    {
        return doc.replace(new RegExp("<[^>]*?/>", "g"), removeSlash);
    }

    //removes final slash from a self-closing tag
    function removeSlash(x)
    {
        return x.replace(/ ?\/>/, ">");
    }

    editor.addCommand("mceCodeEditor", showDialog);

    editor.addButton('code', {
        icon: 'code',
        tooltip: 'Source code',
        onclick: showDialog
    });

    editor.addMenuItem('code', {
        icon: 'code',
        text: 'Source code',
        context: 'tools',
        onclick: showDialog
    });
});