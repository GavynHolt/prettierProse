const app = {};

app.KEYCODE_ESC = 27; //ASCII Keycode for ESC
app.KEYCODE_ENTER = 13; // ASCII Keycode for ENTER

app.thesaurusKey = "9f59c76e-4541-4e94-aeb5-47747d6c0ef0";
app.thesaurusUrl =
  "https://dictionaryapi.com/api/v3/references/thesaurus/json/";

app.query;
app.definitionPromise;

app.clearFields = () => {
  $("#searchField").val("");
  $("#definitionsModal").empty();
  $(".thesaurus").empty();
};

app.getButtonValue = function () {
  // create a promise to await a button click for index value of definition array
  return new Promise((resolve, reject) => {
    // using bubbling, listen for button clicks within #definitionsModal
    $("#definitionsModal").on("click", "button", function (e) {
      resolve(e.currentTarget.value);
    });
  });
};

app.getSynonymChoice = function () {
  return new Promise((resolve, reject) => {
    $(".synonyms-box li p").on("click", function (e) {
      resolve(e.currentTarget.innerText);
    });
  });
};

// Call to Thesaurus API, returns an array of entries
app.getThesaurusReference = word => {
  return $.ajax({
    url: app.thesaurusUrl + word,
    method: "GET",
    dataType: "json",
    data: {
      key: app.thesaurusKey,
    },
  });
};

// Display definitions that match query
app.displayDefinitions = function (defArray, query) {
  // generate definitions from shortdefs property
  for (let i = 0; i < defArray.length; i++) {
    // only print entries which match query exactly ("Headword" must mach query)
    if (defArray[i].hwi.hw === query) {
      let shortDefsHTML = ``;
      defArray[i].shortdef.forEach(definition => {
        shortDefsHTML += `<li><p>${definition}</p></li>`;
      });
      // generate HTML for entire box of current definition
      // button stores array index to later retrieve synonyms
      let definitionBoxHTML = `
        <button value=${i}>
          <div class="definition-box">
            <h3 class="searchedWord">${defArray[i].hwi.hw}</h3>
            <h4 class="fl">${defArray[i].fl}</h4>
            <ol class="definitions">
              ${shortDefsHTML}
            </ol>
          </div>
        </button>`;
      // append all above HTML to .definitions-container
      $("#definitionsModal").append(definitionBoxHTML);
    }
  }
};

// takes in a single definition object from definitionArray, and outputs all related synonyms
app.displaySynonyms = function (curDefinition) {
  app.clearFields();
  // for now, get the first entry of synonyms
  let synonymsUL = ``;
  // loop through all possible synonyms and append to synonymsUL
  for (let i = 0; i < curDefinition.meta.syns.length; i++) {
    curDefinition.meta.syns[i].forEach(synonym => {
      synonymsUL += `<li><p>${synonym}</p></li>`;
    });
  }
  let synonymBoxHTML = `
    <div class="synonyms-box">
      <h3>Synonyns:</h3>
      <ul class="thesaurus">
        ${synonymsUL}
      </ul>
    </div>`;
  $("#definitionsModal").append(synonymBoxHTML);
};

app.handleDefinitonContainer = async function (query) {
  // set the promise from Thesaurus API
  const promise = app.getThesaurusReference(query);
  // get array of definitions for reference
  const definitionArray = await promise.then(res => res);

  // get and display definition using array
  app.displayDefinitions(definitionArray, query);

  // when definition is clicked, get button value and display synonyms for that definition
  const buttonIdx = await app.getButtonValue().then(res => res);
  app.displaySynonyms(definitionArray[buttonIdx]);

  // event listener to get synonym selected from user
  const newWord = await app.getSynonymChoice();
  return newWord;
};

app.displaySentence = function (sentence) {
  $(".searchForm").addClass("hide");
  let sentenceHTML = ``;
  let i = 0;
  let curWord = "";
  // parse char by char through sentence
  while (i < sentence.length) {
    const curChar = sentence[i];
    // if char is a letter or ' , add to word
    if (/[a-zA-Z']/.test(curChar)) {
      curWord += curChar;
    } else {
      // punctuation or space found
      // if word is not empty:
      if (curWord) {
        // add word within span tags to HTML
        sentenceHTML += `<span>${curWord}</span>`;
        curWord = "";
      }
      // add trailing punctuation or spaces after word
      sentenceHTML += curChar;
    }
    i++;
  }
  // fixes edge case of no punctuation at end of sentence, adding final word
  if (curWord) {
    sentenceHTML += `<span>${curWord}</span>`;
  }
  console.log(sentenceHTML);

  // create an array of words without punctuation, then loop through original sentence to insert spans
  console.log(sentenceHTML);
  $(".sentenceContainer").append(`<p>${sentenceHTML}</p>`);
};

app.init = () => {
  // event listener to capture keypresses
  $(document).keydown(function (e) {
    // if ESC press, close definition modal
    if (e.keyCode == app.KEYCODE_ESC) {
      $("#definitionsModal").addClass("hide");
    }
    // if enter pressed (without shift), submit form
    if (e.keyCode == app.KEYCODE_ENTER && !e.shiftKey) {
      $(".searchForm").submit();
    }
  });

  //https://stackoverflow.com/questions/37573608/how-to-make-modal-close-on-click-outside/37573735
  // event listener to close modal when clicked outside
  // $("body").click(function (e) {
  //   console.log(e);
  //   if (
  //     // !$(e.target).closest("#definitionsModalRoot").length &&
  //     !$(e.target).is("#definitionsModal")
  //   ) {
  //     // $("#definitionsModal").addClass("hide");
  //     alert("not modal");
  //   }
  // });
};

$(function () {
  app.init();

  $(".searchForm").on("submit", function (e) {
    e.preventDefault();
    const sentence = $("#searchField").val().trim();
    app.displaySentence(sentence);
    // event listener to look up definitions when span clicked
    $("span").on("click", function (e) {
      // clear fields
      app.clearFields();
      // updated definitions-container position to be right under a given word
      $("#definitionsModal").css("left", e.currentTarget.offsetLeft);
      $("#definitionsModal").css(
        "top",
        e.currentTarget.offsetTop + e.currentTarget.offsetHeight + 5
      );
      $("#definitionsModal").removeClass("hide");
      app.handleDefinitonContainer(e.currentTarget.innerText).then(res => {
        e.currentTarget.innerText = res;
        $("#definitionsModal").addClass("hide");
      });
    });
  });
});
