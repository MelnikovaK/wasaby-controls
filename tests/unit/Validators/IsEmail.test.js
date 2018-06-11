define(
   [
      'Controls/Validate/Validators/IsEmail'
   ],
   function (isEmail) {

      'use strict';

      var
         validEmails = [
            'email@example.com',
            'firstname.lastname@example.com',
            'email@subdomain.example.com',
            'firstname+lastname@example.com',
            '1234567890@example.com',
            'email@example-one.com',
            '_______@example.com',
            'email@example.name',
            'email@example.museum',
            'email@example.svnsmbl',
            'email@example.co.jp',
            'firstname-lastname@example.com',
            'тест@тест.рф',
            'тест@тест.йцу.рф',
            '',
            'NotCaseSensitive@test.com'
         ],
         invalidEmails = [
            'plainaddress',
            '#@%^%#$@#$@#.com',
            '@example.com',
            'Joe Smith <email@example.com>',
            'email.example.com',
            'email@example@example.com',
            '.email@example.com',
            'email.@example.com',
            'email..email@example.com',
            'あいうえお@example.com',
            'email@example.com (Joe Smith)',
            'email@example',
            'email@111.222.333.44444',
            'email@example..com',
            'Abc..123@example.com',
            'тест@example.com',
            'example@тест.com',
            'email@example.toomanysymbols',
            'uuuu@uд.ru'
         ];

      describe('Controls.Validators', function () {
         describe('IsEmail', function () {
            validEmails.forEach(function(item) {
               it('Valid "' + item + '"', function () {
                  assert.equal(isEmail({
                     value: item
                  }), true);
               });
            });
            invalidEmails.forEach(function(item) {
               it('Invalid "' + item + '"', function () {
                  assert.notEqual(isEmail({
                     value: item
                  }), true);
               });
            });
         });
      });
   }
);
