window.addEventListener("DOMContentLoaded", () => {

    loadHTMLTable();
    showToast("Hello!", "Have a nice day!", ":)");
})


const modalElelement = document.getElementById('modal');
modalElelement.addEventListener('hidden.bs.modal', () => {
    // grab the third panel’s collapse element
    const collapseTwoEl = document.getElementById('panelsStayOpen-collapseTwo');
    const collapseThreeEl = document.getElementById('panelsStayOpen-collapseThree');

    // get (or create) its Collapse instance, then hide it
    bootstrap.Collapse.getOrCreateInstance(collapseTwoEl).hide();
    bootstrap.Collapse.getOrCreateInstance(collapseThreeEl).hide();
});

function openModal(question_number) {
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = `Question ${question_number}`;


    const questionStatementDiv = document.getElementById('questionStatement');
    valueOnCsvTable = matrix.find(row => row['#'] === question_number)['Input'];
    valueOnCsvTable = valueOnCsvTable ?? '\\text{Empty: Check the question statement on the CSV file.}';
    valueOnCsvTable = valueOnCsvTable.replace(/\\n/g, '\\\\n');
    katex.render(valueOnCsvTable, questionStatementDiv, { displayMode: true });

    const questionAnswerDiv = document.getElementById('questionAnswer');
    valueOnCsvTable = matrix.find(row => row['#'] === question_number)['Output']
    valueOnCsvTable = valueOnCsvTable ?? '\\text{Empty: Check the question answer on the CSV file.}';
    valueOnCsvTable = valueOnCsvTable.replace(/\\n/g, '\\\\n');
    katex.render(valueOnCsvTable, questionAnswerDiv, { displayMode: true });

    let buttonQuestionCode0 = document.getElementById('buttonQuestionCode0');
    let buttonQuestionCode1 = document.getElementById('buttonQuestionCode1');

    buttonQuestionCode0.onclick = function () {
        registerQuestionAttempt(question_number, 0);
        myModal.hide();
    }
    buttonQuestionCode1.onclick = function () {
        registerQuestionAttempt(question_number, 1);
        myModal.hide();
    }

    const myModal = bootstrap.Modal.getOrCreateInstance(modalElelement);
    myModal.show();
}

function showToast(toastTitle, toastMessage, toastTime){
    const toastLiveExample = document.getElementById('liveToast')
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
    
    document.getElementById('toastTitle').innerHTML = toastTitle
    document.getElementById('toastMessage').innerHTML = toastMessage
    document.getElementById('toastTime').innerHTML = toastTime

    toastBootstrap.show()


}


function loadHTMLTable() {
    requestMatrixData().then(() => {
        // openModal(23);

        htmlTable = document.getElementById('questionsTable');
        htmlTable.innerHTML = '';

        calculateNumberOfDaysSinceLastAttempt();
        calculateAttemptsSummary();
        calculateLoMIandLaMI();

        tableHead = document.createElement('thead');
        for (let i = 0; i < Object.keys(matrix[headersRow]).length; i++) {
            if (matrix[visibilityRow][Object.keys(matrix[headersRow])[i]] == 'TRUE') {
                const cellHeader = document.createElement('th');
                cellHeader.scope = 'col';
                cellHeader.className = 'bg-success';
                cellHeader.classList.add('text-light');
                cellHeader.classList.add('p-2');

                cellHeader.textContent = matrix[headersRow][Object.keys(matrix[headersRow])[i]];

                cellHeader.title = matrix[toolTipsRow][Object.keys(matrix[headersRow])[i]].replace(/\\n/g, '\n');
                cellHeader.style.cursor = 'help';
                cellHeader.style.borderBottom = '1px dotted #888';

                tableHead.appendChild(cellHeader);
            }
        }
        htmlTable.appendChild(tableHead);

        tableBody = document.createElement('tbody');
        for (let i = questionsStartRow; i < matrix.length; i++) {
            commonTableRow = document.createElement('tr');
            // commonTableRow.className = 'opacity-25';

            for (let j = 0; j < Object.keys(matrix[headersRow]).length; j++) {
                let columnSetToVisible = matrix[visibilityRow][Object.keys(matrix[headersRow])[j]]

                if (columnSetToVisible == 'TRUE') {
                    let columnName = Object.keys(matrix[headersRow])[j]
                    let valueOnCsvTable = matrix[i][columnName];

                    const cellData = document.createElement('td');

                    if ((columnName === 'Input' || columnName === 'Output') && valueOnCsvTable) {
                        // valueOnCsvTable = valueOnCsvTable.replace(/\\\\/g, '\\');
                        valueOnCsvTable = valueOnCsvTable.replace(/\\n/g, '\\\\n');
                        katex.render(valueOnCsvTable, cellData);
                    } else {
                        cellData.textContent = valueOnCsvTable;
                    }


                    if (columnName === 'DSLA') {
                        cellData.style.backgroundColor = getCellColor(matrix[i]['#'], 'DSLA', false);
                    } else if (columnName === 'PMG-X') {
                        cellData.style.backgroundColor = getCellColor(matrix[i]['#'], 'PMG-X', false);
                    }

                    commonTableRow.appendChild(cellData);
                }
            }
            commonTableRow.style.cursor = 'pointer'; // Add hand icon to mouse
            commonTableRow.onclick = function () {
                const questionNumber = matrix[i]['#'];
                openModal(questionNumber);
            };
            tableBody.appendChild(commonTableRow);
        }
        htmlTable.appendChild(tableBody);
    });
}

function getCellColor(question_number, propertie, greatestIsGreen) {
    const question = matrix.find(row => row['#'] === question_number);
    const dsla = question[propertie];

    if (propertie === 'PMG-X') {
        if (dsla === Infinity) {
            return 'purple';
        } else if (dsla <= 1) {
            return 'black';
        }
    }

    const dslaValues = matrix
        .filter(row => row[propertie] !== undefined)
        .map(row => parseInt(row[propertie]))
        .filter(value => !isNaN(value) && value >= 0);

    // Handle edge case where all values are the same
    const maxDSLA = Math.max(...dslaValues);
    const minDSLA = Math.min(...dslaValues);

    // Calculate the normalized position (0 to 1) of this value in the range
    // Invert the position so smaller values (recent attempts) get higher positions (greener)
    const normalizedPosition = 1 - (dsla - minDSLA) / (maxDSLA - minDSLA);

    // Red-Yellow-Green color scheme
    let red, green, blue = 0;

    if (greatestIsGreen) {
        if (normalizedPosition <= 0.5) {
            // First half: Red to Yellow (increase green)
            green = 255;
            red = Math.floor(255 * (normalizedPosition * 2));
        } else {
            // Second half: Yellow to Green (decrease red)
            green = Math.floor(255 * ((1 - normalizedPosition) * 2));
            red = 255;
        }
    }
    else {
        if (normalizedPosition <= 0.5) {
            // First half: Green to Yellow (decrease green)
            red = 255;
            green = Math.floor(255 * (normalizedPosition * 2));
        } else {
            // Second half: Yellow to Red (increase red)
            red = Math.floor(255 * ((1 - normalizedPosition) * 2));
            green = 255;
        }
    }

    return `rgb(${red},${green},${blue})`;
}

function calculateNumberOfDaysSinceLastAttempt() {
    for (let i = questionsStartRow; i < matrix.length; i++) {
        const dateStrings = matrix[i]['Date Vector'].replace(/[\[\]]/g, '').split(',');
        const lastDate = new Date(dateStrings[dateStrings.length - 1]);
        const today = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

        const timeDifferenceInMs = today - lastDate;
        const timeDifferenceInDays = Math.floor(timeDifferenceInMs / (1000 * 60 * 60 * 24));

        matrix[i]['DSLA'] = timeDifferenceInDays;
    }
}

function calculateAttemptsSummary() {
    for (let i = questionsStartRow; i < matrix.length; i++) {
        let totalAttempts = 0;
        let attemptsWithoutHelp = 0;
        let attemptsWithHelp = 0;
        let lastAttemptMessage = '';

        let codeVector = matrix[i]['Code Vector'];
        if (typeof codeVector === 'number') {
            codeVector = [codeVector];
        } else {
            codeVector = codeVector.replace(/[\[\]]/g, '').split(',').map(Number);
        }

        codeVector.forEach(code => {
            if (code == 1) {
                attemptsWithoutHelp++;
            } else {
                attemptsWithHelp++;
            }
            totalAttempts++;
        });

        if (codeVector[codeVector.length - 1] != 1) {
            lastAttemptMessage += 'W/H';
        } else {
            lastAttemptMessage += 'From memory';
        }

        let summary = [totalAttempts, attemptsWithoutHelp, attemptsWithHelp, lastAttemptMessage].join('; ');

        matrix[i]['Attempts Summary'] = summary;
    }
}

function calculateLoMIandLaMI() {
    for (let i = questionsStartRow; i < matrix.length; i++) {
        let memoryIntervals = [];

        let codeVector = matrix[i]['Code Vector'];
        if (typeof codeVector === 'number') {
            codeVector = [codeVector];
        } else {
            codeVector = codeVector.replace(/[\[\]]/g, '').split(',').map(Number);
        }

        let dateStrings = matrix[i]['Date Vector'].replace(/[\[\]]/g, '').split(',');

        // console.log('Code Vector:', codeVector);
        for (let j = 1; j < codeVector.length; j++) {
            if (codeVector[j] == 1) {
                let timeDifferenceInMs = new Date(dateStrings[j]) - new Date(dateStrings[j - 1]);
                let timeDifferenceInDays = Math.floor(timeDifferenceInMs / (1000 * 60 * 60 * 24));
                memoryIntervals.push(timeDifferenceInDays);
            }
        }

        if (memoryIntervals.length > 0) {
            const maxInterval = Math.max(...memoryIntervals);
            matrix[i]['LoMI'] = maxInterval;

            if (codeVector[codeVector.length - 1] == 1) {
                matrix[i]['LaMI'] = memoryIntervals[memoryIntervals.length - 1];
            } else {
                matrix[i]['LaMI'] = '0';
            }
        } else {
            matrix[i]['LoMI'] = '0'; // Default value if no intervals
            matrix[i]['LaMI'] = '0';
        }


        matrix[i]['PMG-D'] = matrix[i]['DSLA'] - matrix[i]['LaMI'];

        const pmgX = matrix[i]['DSLA'] / matrix[i]['LaMI'];
        matrix[i]['PMG-X'] = isFinite(pmgX) ? pmgX.toFixed(2) : pmgX;
    }
}