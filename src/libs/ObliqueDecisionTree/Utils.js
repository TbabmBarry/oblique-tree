import _ from 'lodash';
import * as d3 from 'd3';

/**
 * Return information about the size of the whole Oblique Decision Tree (Odt)
 * and its position relative to the viewport. 
 * @date 2022-06-14
 * @param {node} node
 */
export const adjustedClientRect = (node) => {
    const curr = _.pick(node.getBoundingClientRect(), ['x', 'y', 'width', 'height', 'top', 'right', 'bottom', 'left']);
    curr.top += window.scrollY;
    curr.bottom += window.scrollY;
    curr.y += window.scrollY;
    curr.left += window.scrollX;
    curr.right += window.scrollX;
    curr.x += window.scrollX;
    curr.scale = curr.height / 2160;
    curr.screenHeight = curr.height;
    curr.screenWidth = curr.width;
    // TODO: define inner svg width and height according to returned DOMRect size
    curr.height = 2160;
    curr.width = curr.height;
    return curr;
};

/**
 * Return two end points on current split
 * @date 2022-06-21
 * @param {featureIdxArr} featureIdxArr
 * @param {currNode} currNode
 * @param {that} that
 */
export const getEndSplitPoint = (featureIdxArr, currNode, that) => {
    const sv = currNode.data.split;
    const getSplitY = (x) => (sv[featureIdxArr[0]] * x + sv[sv.length-1]) / (- sv[featureIdxArr[1]]);
    const getSplitX = (y) => (sv[featureIdxArr[1]] * y + sv[sv.length-1]) / (- sv[featureIdxArr[0]]);
    const rangeX = d3.extent(that.trainX, d => d[that.constants.featureArr[featureIdxArr[0]]]);
    const rangeY = d3.extent(that.trainX, d => d[that.constants.featureArr[featureIdxArr[1]]]);
    const endPointsPair = [];
    let tmpMaxX = rangeX[1],
        tmpMaxY = rangeY[1],
        tmpMinX = rangeX[0],
        tmpMinY = rangeY[0];
    if (getSplitY(tmpMaxX) > tmpMaxY || getSplitY(tmpMaxX) < tmpMinY) {
        tmpMaxX = Math.max(getSplitX(tmpMaxY), getSplitX(tmpMinY));
    }
    if (getSplitY(tmpMinX) < tmpMinY || getSplitY(tmpMinX) > tmpMaxY) {
        tmpMinX = Math.min(getSplitX(tmpMaxY), getSplitX(tmpMinY));
    }

    if (getSplitX(tmpMaxY) > tmpMaxX || getSplitX(tmpMaxY) < tmpMinX) {
        tmpMaxY = Math.max(getSplitY(tmpMaxX), getSplitY(tmpMinX));
    }

    if (getSplitX(tmpMinY) < tmpMinX || getSplitX(tmpMinY) > tmpMaxX) {
        tmpMinY = Math.min(getSplitY(tmpMaxX), getSplitY(tmpMinX));
    }
    endPointsPair.push({
        x: tmpMaxX,
        y: tmpMaxY,
    });
    endPointsPair.push({
        x: tmpMinX,
        y: tmpMinY,
    });
    return endPointsPair;
}

/**
 * Return effective feature contribution array with index and array of values
 * @date 2022-06-22
 * @param {currNode} currNode
 * @param {that} that
 */
export const getEffectiveFeatureContribution = (currNode, that) => {
    const effectiveFeatureArr = [];
    let range;
    let currRange;
    currNode.data.featureContribution.forEach((val, i) => {
        currRange = d3.extent(val);
        if (i === 0) range = currRange.slice();
        else {
            range[0] = Math.min(range[0], currRange[0]);
            range[1] = Math.max(range[1], currRange[1]);
        };
        if (!val.every(element => element === 0)) {
            const featureContributionArr = val.map((ele, idx) => {
                return {
                    label: idx,
                    value: ele
                };
            });
            effectiveFeatureArr.push({
                featureName: that.constants.featureArr[i],
                featureContribution: featureContributionArr,
            });
        }
    });

    return {
        fcArr: effectiveFeatureArr, 
        fcRange: range
    };
}

/**
 * Traverse the n-ary tree and update the position of each node
 * @date 2022-06-25
 * @param {node} node
 */
export const traverseTree = (node) => {
    if (!node) return;
    // Move tree diagram to let by 500
    node.x -= 320;

    // TODO: Filter effective feature contribution in leaf nodes

    if (node.children && node.children.length > 0) {
        node.children.map(child => traverseTree(child));
    }
}

/**
 * Return the maximum depth of the tree
 * @date 2022-07-14
 * @param {node} node
 */
export const maxDepth = (node) => {
    if (!node) return 0;
    if (!node.children || node.children.length === 0) return 1;
    return 1 + d3.max(node.children, child => maxDepth(child));
}

export const maxWidth = (node) => {
    if (!node) return 0;
    let maxWidth = 1n, que = [[0n, node]];
    while (que.length) {
        const width = que[que.length-1][0] + 1n;
        if (width > maxWidth) maxWidth = width;
        let tmp = [];
        que.forEach(([idx, q]) => {
            if (q.children && q.children.length > 0) {
                q.children.forEach((child, i) => {
                    tmp.push([idx*2n + BigInt(i)*1n, child]);
                })
            }
        });
        que = tmp;
    }
    return Number(maxWidth);
}

/**
 * Return normalized array of values
 * @date 2022-06-29
 * @param {any} count
 * @returns {any}
 */
export const normalizeArr = (count) => {
    const absCount = count.map(element => Math.abs(element));
    const n = _.sum(absCount);
    return absCount.map(element => element / n);
};

/**
 * Retrieve all available properties of the DOM element
 * @date 2022-07-19
 * @param {o} o
 * @param {e = o} parm2
 * @param {props = []} parm3
 */
export const getAllProperties = (o, e = o, props = []) => e.__proto__ ? getAllProperties(o, e.__proto__, props.concat(Object.getOwnPropertyNames(e))) : Object.fromEntries([...new Set(props.concat(Object.getOwnPropertyNames(e)))].map(prop => [prop, o[prop]]));

export function dodge(X, radius) {
    const Y = new Float64Array(X.length);
    const radius2 = radius ** 2;
    const epsilon = 1e-3;
    let head = null, tail = null;

    // Returns true if circle (x, y) intersects with any circle in the queue.
    function intersects(x, y) {
        let a = head;
        while (a) {
            const ai = a.index;
            if (radius2 - epsilon > (X[ai] - x) ** 2 + (Y[ai] - y) ** 2) return true;
            a = a.next;
        }
        return false;
    }

    // Place each circle sequentially in the queue.
    for (const bi of d3.range(X.length).sort((i, j) => X[i] - X[j])) {
        // Remove circles from the queue that can't intersect the new circle b.
        while (head && X[head.index] < X[bi] - radius2) head = head.next;

        // Choose the minimum non-intersecting tangent.
        if (intersects(X[bi], Y[bi] = 0)) {
            let a = head;
            Y[bi] = Infinity;
            do {
                const ai = a.index;
                let y = Y[ai] + Math.sqrt(radius2 - (X[ai] - X[bi]) ** 2);
                if (y < Y[bi] && !intersects(X[bi], y)) Y[bi] = y;
                a = a.next;
            } while (a);
        }

        // Add circle b to the queue.
        const b = { index: bi, next: null };
        if (head == null) head = tail = b;
        else tail = tail.next = b;
    }
    return Y;
}

/**
 * KDE estimates the probability distribution of a random variable.
 * The kernel's bandwidth determines the estimates' smoothness.
 * @date 2022-06-30
 * @param {any} kernel
 * @param {any} X
 * @returns {any}
 */
export const kernelDensityEstimator = (kernel, X) => {
    return (V) => {
        return X.map((x) => {
            return [x, d3.mean(V, (v) => kernel(x - v))];
        })
    }
};

/**
 * An Epanechnikov Kernel is a kernel function that is of quadratic form.
 * @date 2022-06-30
 * @param {any} k
 * @returns {any}
 */
export const kernelEpanechnikov = (k) => {
    return (v) => {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    }
} 

