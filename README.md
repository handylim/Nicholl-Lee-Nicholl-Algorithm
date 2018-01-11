# Nicholl–Lee–Nicholl Algorithm

Nicholl–Lee–Nicholl algorithm is an algorithm that divides the clipping window to 9 area, and matches the start point’s area code to one of the 9 areas. The area code that being handled by algorithm are 3 area which are *inside*, *left*, and *top-left* area of the clipping window. If the case is not one of the case that handled by algorithm, certain parts of that case (which are line position and the clipping window) are temporarily transformed to the one of the handled case depending on the location. The bottom, right and top cases will be transformed to the left case. The top-right , bottom-right and bottom-left will be transformed to the top-left case.

Then, the imaginary lines are drawn from the starting point to the 4 edges of the clipping window. The areas between the imaginary lines are named according to the side(s) where the line will be clipped from if the end point is in that area.

1. In *inside* case, the areas are named T for top, L for left, R for right, and B for bottom.
2. In *left* case, the areas are named L for left, TL for top and left, LR for left and right, and TB for top and bottom.
3. In *top-left* case, the areas are named L for left , T for top, TR for top and right, LB for left and bottom, and TB for top and bottom or LR for left and right.

The last step is just locate the end point of the line that wants to be clipped, and clipped it according to the name of that area against the side(s) of the clipping window.
