/* global define, beforeEach, afterEach, describe, context, it, assert, $ws */
define(['js!SBIS3.CONTROLS.TextBox'], function (TextBox) {
    'use strict';
    var
        TB,
        inputField,
        event;

    describe('SBIS3.CONTROLS.TextBox', function () {
        beforeEach(function() {
            if (typeof $ === 'undefined') {
                this.skip();
            }
            var container = $('<div></div>');
            $('#mocha').append(container);
            TB = new TextBox({
                element: container,
                text: '1.234',
                maxLength: 23
            });
            inputField = TB._inputField;
        });
        describe('Trim', function (){
            it('setText', function (){
                TB.setProperty('trim', true);
                TB.setText('   пробелы    ');
                TB._focusOutHandler();
                assert.equal(TB.getText(), 'пробелы');
            });
            it('on paste&drop', function (){
                TB.setProperty('trim', true);
                TB.setText('   пробелы    ');
                TB._pasteHandler();
                assert.equal(TB.getText(), 'пробелы');
            });

        });
        afterEach(function () {
            TB.destroy();
            TB = undefined;
            inputField = undefined;
            event = undefined;
        });
    });
});