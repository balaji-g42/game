$(function () {
    const initialPositions = {}; // Store initial positions for revert
    const gridState = {}; // Dynamic grid tracking
    let correctAnswers = 0;
    const answerMap = {
        "draggable-1": "draggable-2",
        "draggable-3": "draggable-4",
        "draggable-5": "draggable-6"
    };

    // Store initial positions of all draggable elements
    $(".drag-box").each(function () {
        const id = $(this).attr("id");
        initialPositions[id] = $(this).offset();
    });

    // Make elements draggable
    $(".drag-box").draggable({
        revert: "invalid",
        start: function () {
            $(this).css("z-index", 3); // Bring dragged element to the top
        },
        stop: function () {
            $(this).css("z-index", ""); // Reset z-index after drop
        }
    });

    // Confirmation popup logic
    $("#openConfirmationPopup").click(function () {
        $("#confirmationPopup").show();
    });
    $("#closeConfirmationPopup").click(function () {
        $("#confirmationPopup").hide();
    });

    $("#moveToNextStep").click(function () {
        $("#confirmationPopup").hide();
        if (correctAnswers === Object.keys(answerMap).length) {
            location.href = "beach-raft-level-two.html"; // Redirect to the next page
        } else {
            Object.keys(initialPositions).forEach((id) => {
                const element = $(`#${id}`);
                const initialPos = initialPositions[id];
                const previousCellId = element.attr("data-grid");
    
                // Remove from gridState if it was placed in the grid
                if (previousCellId) {
                    delete gridState[previousCellId];
                }
    
                // Animate the element back to its initial position
                element.animate({
                    top: initialPos.top + "px",
                    left: initialPos.left + "px"
                }).removeAttr("data-grid"); // Clear the grid data attribute
            });
            // move everyhting to their initial state
        }
    });

    // Make the drop area droppable
    $(".drop-pad").droppable({
        accept: ".drag-box",
        drop: function (event, ui) {
            const droppedElement = ui.draggable;
            const droppedId = droppedElement.attr("id");
            const position = $(this).offset();
            const elementOffset = ui.helper.offset();

            // Calculate grid dimensions
            const gridWidth = $(this).width() / 3; // 3 columns
            const gridHeight = $(this).height() / 2; // 2 rows
            const leftOffset = Math.round((elementOffset.left - position.left) / gridWidth) * gridWidth;
            const topOffset = Math.round((elementOffset.top - position.top) / gridHeight) * gridHeight;

            const colIndex = Math.round(leftOffset / gridWidth);
            const rowIndex = Math.round(topOffset / gridHeight);
            const cellId = `${rowIndex}-${colIndex}`;

            // Check if dropped outside the grid
            if (rowIndex < 0 || colIndex < 0 || rowIndex >= 2 || colIndex >= 3) {
                revertToPreviousPosition(droppedElement);
                return;
            }

            const isQuestion = droppedElement.data("type") === "question";

            // Check row constraints
            if ((isQuestion && rowIndex !== 0) || (!isQuestion && rowIndex !== 1)) {
                revertToPreviousPosition(droppedElement);
                return;
            }

            playAudio();

            // Handle overlaps
            const occupiedElementId = gridState[cellId];
            if (occupiedElementId) {
                const occupyingElement = $(`#${occupiedElementId}`);
            
                // Check if the dropped element is already in the same cell
                if (occupiedElementId === droppedElement.attr("id")) {
                    revertToPreviousPosition(droppedElement);
                    return;
                }
            
                const isSameType = occupyingElement.data("type") === droppedElement.data("type");
            
                if (isSameType) {
                    // Same type: revert the occupying element to its initial position
                    revertToInitial(occupyingElement);
                } else {
                    // Different type: revert the dropped card
                    revertToPreviousPosition(droppedElement);
                    return;
                }
            }

            // Update gridState before placing the new card
            const previousCellId = droppedElement.attr("data-grid");
            if (previousCellId) {
                delete gridState[previousCellId]; // Clear the previous position from gridState
            }

            // Snap the dropped element to the grid
            droppedElement.css({
                left: position.left + leftOffset + "px",
                top: position.top + topOffset + "px",
                position: "absolute"
            }).attr("data-grid", cellId);

            // Update gridState with the new position
            gridState[cellId] = droppedId;
        }
    });

    // Revert the element to its initial position
    function revertToInitial(element) {
        const id = element.attr("id");
        const initialPos = initialPositions[id];
        const previousCellId = element.attr("data-grid");

        if (previousCellId) {
            delete gridState[previousCellId]; // Remove the element from its grid position
        }

        element.animate({
            top: initialPos.top + "px",
            left: initialPos.left + "px"
        }).removeAttr("data-grid");
    }

    // Revert the element to its previous position (either grid or initial)
    function revertToPreviousPosition(element) {
        const previousCellId = element.attr("data-grid");
        if (previousCellId) {
            // Revert to the previous grid position
            const [row, col] = previousCellId.split("-");
            const gridWidth = $(".drop-pad").width() / 3;
            const gridHeight = $(".drop-pad").height() / 2;
            const gridOffset = $(".drop-pad").offset();

            element.animate({
                left: gridOffset.left + col * gridWidth + "px",
                top: gridOffset.top + row * gridHeight + "px"
            });
        } else {
            // Revert to initial position
            revertToInitial(element);
        }
    }

    function playAudio() {
        const snd = new Audio("../assets/audio/click.mp3");
        snd.play();
        snd.currentTime = 0;
    }

    // Check the user's answer alignment
    function checkResult() {
        playAudio(); // Play sound when checking
        correctAnswers = 0; // Initialize counter for correct answers
    
        Object.keys(answerMap).forEach((questionId) => {
            const questionElement = $(`#${questionId}`);
            const questionGrid = questionElement.attr("data-grid");
    
            if (questionGrid) {
                const colIndex = questionGrid.split("-")[1]; // Extract column index
                const expectedAnswerId = answerMap[questionId];
                const expectedAnswerGrid = `1-${colIndex}`; // Same column, row 1
    
                // Check if the expected answer is in the right grid position
                if (gridState[expectedAnswerGrid] === expectedAnswerId) {
                    correctAnswers++;
                }
            }
        });
        // console.log(correctAnswers);
        // Display results to the user
        // if (correctAnswers === Object.keys(answerMap).length) {
        //     alert("Congratulations! All answers are correct!");
        // } else {
        //     alert(`You got ${correctAnswers} out of ${Object.keys(answerMap).length} correct.`);
        // }
    }

    // Attach the checkResult function to the "Check" button
    $(".check-button").on("click", checkResult);
});
