document.addEventListener(
  "DOMContentLoaded",
  () => {
    console.log("IronGenerator JS imported successfully!");
  },
  false
);

console.log("hi");

// $("#add").live("click", function() {
//   $(this)
//     .closest("form")
//     .append('<input type="text" value="test">');
// });

$("#add").click(() => {
  console.log("new field");
  var new_input = "<input type='text' name='ingredients'>";
  $("#ingredients").append(new_input);
});
