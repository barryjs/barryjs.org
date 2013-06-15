module.exports = function (barry) {
  var phonebook = barry.service('phonebook/:key', new barry.DictionaryService);

  phonebook.extend(require(__dirname + '/phonebook'));

  // Kevin Mitnick is a badass hacker, so his phone number magically changes
  // every two seconds! Ok, maybe not, but it's still good for our demo.
  setInterval(function () {
    var value = phonebook.get("Mitnick, Kevin");
    value = value.slice(0, 8) + ((+value.slice(8) + 3943) % 9000 + 1000);
    phonebook.set("Mitnick, Kevin", value);
  }, 2000);
};
