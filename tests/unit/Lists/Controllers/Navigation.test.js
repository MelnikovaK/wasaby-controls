/**
 * Created by kraynovdo on 29.08.2017.
 */
/* global define, beforeEach, afterEach, describe, context, it, assert, $ws */
define(
   [
      'js!WSControls/Lists/Controllers/PageNavigation',
      'js!WSControls/Lists/Controllers/OffsetNavigation',
      'js!WSControls/Lists/Controllers/PositionNavigation',
      'js!WS.Data/Collection/RecordSet',
      'js!WS.Data/Source/SbisService'
   ],
   function (PageNavigation,
             OffsetNavigation,
             PositionNavigation, RecordSet, SbisService) {

      'use strict';

      describe('WSControls.Controllers.Navigation', function () {
         var data, dataDown, dataRs, dataRsDown;

         beforeEach(function() {
            data = [
               {id : 1, title : 'Первый'},
               {id : 2, title : 'Второй'},
               {id : 3, title : 'Третий'},
               {id : 4, title : 'Четвертый'}
            ];
            dataDown = [
               {id : 5, title : 'Первый'},
               {id : 6, title : 'Второй'},
               {id : 7, title : 'Третий'},
               {id : 8, title : 'Четвертый'}
            ];
            dataRs = new RecordSet({
               rawData: data,
               idProperty : 'id'
            });

            dataRsDown = new RecordSet({
               rawData: dataDown,
               idProperty : 'id'
            })

         });

         describe('PageNavigation', function () {
            it('init', function () {
               var pNav = new PageNavigation({
                  page: 1,
                  pageSize: 4
               });
               assert.equal(2, pNav._nextPage, 'State nextPage is incorrect');
               assert.equal(0, pNav._prevPage, 'State prevPage is incorrect');
            });

            it('calculateState', function () {
               var pNav = new PageNavigation({
                  page: 1,
                  pageSize: 4
               });
               dataRs.setMetaData({more: true});

               pNav.calculateState(dataRs);

               assert.equal(2, pNav._nextPage, 'State nextPage is incorrect after reload');
               assert.isTrue(pNav._more, 'State more is incorrect  after reload');
               assert.isTrue(pNav.hasMoreData('down'), 'Method hasMoreData returns incorrect value after reload');
               assert.isTrue(pNav.hasMoreData('up'), 'Method hasMoreData returns incorrect value after reload');


               dataRsDown.setMetaData({more: false});
               pNav.calculateState(dataRsDown, 'down');

               assert.equal(3, pNav._nextPage, 'State nextPage is incorrect after load down');
               assert.isFalse(pNav._more, 'State more is incorrect after load down');
               assert.isFalse(pNav.hasMoreData('down'), 'Method hasMoreData returns incorrect value after reload');
               assert.isTrue(pNav.hasMoreData('up'), 'Method hasMoreData returns incorrect value after reload');
            });

            it('calculateState + withTotalCount', function () {
               var pNav = new PageNavigation({
                  page: 0,
                  mode: 'totalCount',
                  pageSize: 4
               });
               dataRs.setMetaData({more: 8});

               pNav.calculateState(dataRs);
               assert.equal(1, pNav._nextPage, 'State nextPage is incorrect after reload');
               assert.equal(8, pNav._more, 'State more is incorrect  after reload');

               assert.isTrue(pNav.hasMoreData('down'), 'Method hasMoreData returns incorrect value after reload');
               assert.isFalse(pNav.hasMoreData('up'), 'Method hasMoreData returns incorrect value after reload');

               dataRsDown.setMetaData({more: 8});
               pNav.calculateState(dataRsDown, 'down');
               assert.equal(2, pNav._nextPage, 'State nextPage is incorrect after load down');
               assert.equal(8, pNav._more, 'State more is incorrect after load down');
               assert.isFalse(pNav.hasMoreData('down'), 'Method hasMoreData returns incorrect value after load down');
               assert.isFalse(pNav.hasMoreData('up'), 'Method hasMoreData returns incorrect value after load down');
            });

            it('prepareQueryParams', function () {
               var params;
               var pNav = new PageNavigation({
                  page: 1,
                  pageSize: 4
               });

               params = pNav.prepareQueryParams();
               assert.deepEqual({limit: 4, offset: 4}, params, 'Method prepareQueryParams returns incorrect parameters before reload');

               params = pNav.prepareQueryParams(undefined, 'down');
               assert.deepEqual({limit: 4, offset: 8}, params, 'Method prepareQueryParams returns incorrect parameters before load down');

               params = pNav.prepareQueryParams(undefined, 'up');
               assert.deepEqual({limit: 4, offset: 0}, params, 'Method prepareQueryParams returns incorrect parameters before load up');
            })

         });

         describe('OffsetNavigation', function () {
            it('prepareSource', function () {
               var pNav = new OffsetNavigation({
                  page: 1,
                  pageSize: 4
               });
               var source = new SbisService({
                  endpoint: 'ОбъектБл',
                  idProperty: 'id'
               });
               pNav.prepareSource(source);
               var options = source.getOptions();
               assert.equal(SbisService.prototype.NAVIGATION_TYPE.OFFSET, options.navigationType, 'Method prepareSource doesn\'t set correct navigationType to source');

            });
         });

         describe('PositionNavigation', function () {
            it('prepareSource', function () {
               var pNav = new PositionNavigation({
                  page: 1,
                  pageSize: 4
               });
               var source = new SbisService({
                  endpoint: 'ОбъектБл',
                  idProperty: 'id'
               });
               pNav.prepareSource(source);
               var options = source.getOptions();
               assert.equal(SbisService.prototype.NAVIGATION_TYPE.POSITION, options.navigationType, 'Method prepareSource doesn\'t set correct navigationType to source');

            });
         })
      });
   });