

gemini.suite('SBIS3.CONTROLS.TabButtons Online', function () {

    gemini.suite('base', function (test) {

        test.setUrl('/regression_tab_buttons_online.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab2 = find('[data-id="2"]');
				this.tab3 = find('[data-id="3"]');
                this.tab4 = find('[data-id="4"]');
                this.add1 = find('.controls-TabButton__additionalText1');
                this.add2 = find('.controls-TabButton__additionalText2');
            })

            .capture('plain')
			
			.capture('hovered_snd_tab', function (actions) {
                actions.mouseMove(this.tab2);
            })

            .capture('hovered_tab', function (actions) {
                actions.mouseMove(this.tab3);
            })
			
			.capture('hovered_tab_with_add_text', function (actions) {
                actions.mouseMove(this.tab4);
            })

            .capture('hovered_add_text_1', function (actions) {
                actions.click(this.tab4);
                actions.mouseMove(this.add1);
            })

            .capture('hovered_add_text_2', function (actions) {
                actions.mouseMove(this.add2);
            })

            .capture('checked', function (actions) {
                actions.click(this.tab3);
            })
    });
	
	gemini.suite('with_items_in_free_place', function (test) {

        test.setUrl('/regression_tab_buttons_online_7.html').skip('chrome').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('[sbisname="TabButtons"]', 40000);
                this.tab3 = find('[data-id="id3"]');
                this.tab5 = find('[data-id="id5"]');
                this.add1 = find('.controls-TabButton__additionalText1');
                this.add2 = find('.controls-TabButton__additionalText2');
				this.button = find('[sbisname="Button 1"]');
            })

            .capture('plain', function (actions) {
                actions.mouseMove(this.tab3);
            })
			
			.capture('hovered_tab_with_add_text', function (actions) {
                actions.mouseMove(this.tab5);
            })

            .capture('hovered_add_text_1', function (actions) {
                actions.click(this.tab5);
                actions.mouseMove(this.add1);
            })

            .capture('hovered_add_text_2', function (actions) {
                actions.mouseMove(this.add2);
            })
			
			.capture('hovered_button', function (actions) {
                actions.mouseMove(this.button);
            })
    });
	
	gemini.suite('with_main_tab', function (test) {

        test.setUrl('/regression_tab_buttons_online_2.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab2 = find('[data-id="2"]');
				this.tab3 = find('[data-id="3"]');
                this.tab4 = find('[data-id="4"]');
				actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('TabButton 1').setEnabled(true);
                });
            })

            .capture('plain')

			.capture('hovered_snd_tab', function (actions) {
                actions.mouseMove(this.tab2);
            })
			
            .capture('hovered_tab', function (actions) {
                actions.mouseMove(this.tab3);
            })

            .capture('checked', function (actions) {
                actions.click(this.tab3);
            })
    });
	
	gemini.suite('with_main_tab_and_left_align', function (test) {

        test.setUrl('/regression_tab_buttons_online_5.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab3 = find('[data-id="3"]');
                this.tab4 = find('[data-id="4"]');
				actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('TabButton 1').setEnabled(true);
                });
            })

            .capture('plain')

            .capture('hovered_tab', function (actions) {
                actions.mouseMove(this.tab3);
            })

            .capture('checked', function (actions) {
                actions.click(this.tab3);
            })
    });

    gemini.suite('left_align', function (test) {

        test.setUrl('/regression_tab_buttons_online_3.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab3 = find('[data-id="3"]');
                this.tab4 = find('[data-id="4"]');
            })

            .capture('plain')

            .capture('hovered_tab', function (actions) {
                actions.mouseMove(this.tab3);
            })

            .capture('checked', function (actions) {
                actions.click(this.tab3);
            })
    });
	
	gemini.suite('with_menu_link', function (test) {

        test.setUrl('/regression_tab_buttons_online_4.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab3 = find('[data-id="3"]');
                this.tab4 = find('[data-id="4"]');
				this.menu = find('[sbisname="MenuLink 1"]');
				actions.click(this.tab4);
				actions.mouseMove(this.tab3);
            })

            .capture('plain')
			
			.capture('hovered_menu_link', function (actions) {
				actions.mouseMove(this.menu);
            })
			
			.capture('opened_menu_link', function (actions) {
				actions.click(this.menu);
            })
    });
	
	gemini.suite('with_add_text_and_left_align', function (test) {

        test.setUrl('/regression_tab_buttons_online_6.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab3 = find('[data-id="3"]');
                this.tab4 = find('[data-id="4"]');
                this.add1 = find('.controls-TabButton__additionalText1');
                this.add2 = find('.controls-TabButton__additionalText2');
            })

			.capture('hovered_add_text_1', function (actions) {
                actions.mouseMove(this.add1);
            })

            .capture('hovered_add_text_2', function (actions) {
                actions.mouseMove(this.add2);
            })

            .capture('not_active_main_and_hovered_at1', function (actions) {
                actions.click(this.tab3);
                actions.mouseMove(this.add1);
            })

            .capture('not_active_main_and_hovered_at2', function (actions) {
                actions.mouseMove(this.tab3);
                actions.mouseMove(this.add2);
            })

            .capture('disabled_and_hovered_at1', function (actions) {
                actions.executeJS(function (window) {
                    window.$ws.single.ControlStorage.getByName('TabButton 1').setEnabled(true);
                });
                actions.mouseMove(this.tab3);
                actions.mouseMove(this.add1);
            })

            .capture('disabled_and_hovered_at2', function (actions) {
                actions.mouseMove(this.tab3);
                actions.mouseMove(this.add2);
            })
	});
	
	gemini.suite('simple_view', function (test) {

        test.setUrl('/regression_tab_buttons_online_8.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab3 = find('[data-id="3"]');
                this.tab4 = find('[data-id="4"]');
                this.add1 = find('.controls-TabButton__additionalText1');
                this.add2 = find('.controls-TabButton__additionalText2');
            })

			.capture('plain')
			
			.capture('hovered_tab', function (actions) {
                actions.mouseMove(this.tab3);
            })
	});
	
	gemini.suite('simple_view_orange', function (test) {

        test.setUrl('/regression_tab_buttons_online_9.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab3 = find('[data-id="3"]');
                this.tab4 = find('[data-id="4"]');
                this.add1 = find('.controls-TabButton__additionalText1');
                this.add2 = find('.controls-TabButton__additionalText2');
            })

			.capture('plain')
	});
	
	gemini.suite('simple_view_hidden', function (test) {

        test.setUrl('/regression_tab_buttons_online_10.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab3 = find('[data-id="3"]');
                this.tab1 = find('[data-id="1"] .controls-TabButton__caption');
            })

			.capture('plain', function (actions) {
				actions.mouseMove(this.tab3);
				actions.mouseMove(this.tab1);
			})
			
			.capture('hovered_tab', function (actions) {
                actions.mouseMove(this.tab3);
            })
	});
	
	gemini.suite('with_counters', function (test) {

        test.setUrl('/regression_tab_buttons_online_11.html').setCaptureElements('.capture')

            .before(function (actions) {
                actions.waitForElementToShow('#buttons', 40000);
                this.tab3 = find('[data-id="3"]');
                this.tab1 = find('[data-id="1"] .controls-TabButton__caption');
            })

			.capture('plain')
	});
});