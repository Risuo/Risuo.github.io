/*
 * Url preview script
 * powered by jQuery (http://www.jquery.com)
 * written by Alen Grakalic (http://cssglobe.com)
 * for more info visit http://cssglobe.com/post/1695/easiest-tooltip-and-image-preview-using-jquery
 *
 *
 * edited by Peter Miller to include the repositioning of the image to the left of the mouse
 * if the mouse is on the right-half side of the page
 *
 */
this.screenshotPreview = function () {
    /* CONFIG */
    xOffset = 10;
    yOffset = 30;
    threeFifthsScreenWidth = ($(window).innerWidth() * 3) / 5;
    halfScreenHeight = $(window).innerHeight() / 2;
    // console.log(halfScreenHeight);
    /* END CONFIG */

    $("a.screenshot").hover(function (e) {
        this.t = this.title;
        this.title = "";
        var c = (this.t != "") ? "<br/>" + this.t : "";
        $("body").append("<p id='screenshot'><img src='" + this.rel + "' alt='url preview' />" + c + "</p>");

        // Determine position based on mouse position
        var topPosition = (e.pageY - xOffset);
        var leftPosition = (e.pageX + yOffset);

        // Adjust position if the mouse is more than 50% of the screen width to the right
        if (e.pageX > threeFifthsScreenWidth) {
            leftPosition = (e.pageX - yOffset - $("#screenshot").width());
        }

        // Adjust position if the mouse is more than 50% of the screen height down
        if (e.pageY > halfScreenHeight) {
            topPosition = (e.pageY - xOffset - $("#screenshot").height());
        }

        $("#screenshot")
            .css("top", topPosition + "px")
            .css("left", leftPosition + "px")
            .fadeIn("fast");
    }, function () {
        this.title = this.t;
        $("#screenshot").remove();
    });

    $("a.screenshot").mousemove(function (e) {
        var topPosition = (e.pageY - xOffset);
        var leftPosition = (e.pageX + yOffset);

        if (e.pageX > threeFifthsScreenWidth) {
            leftPosition = (e.pageX - yOffset - $("#screenshot").width());
        }

        if (e.pageY > halfScreenHeight) {
            topPosition = (e.pageY - xOffset - $("#screenshot").height());
        }

        $("#screenshot")
            .css("top", topPosition + "px")
            .css("left", leftPosition + "px");
    });
};

// starting the script on page load
$(document).ready(function () {
    screenshotPreview();
});