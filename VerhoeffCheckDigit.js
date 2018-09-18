module.exports = class VerhoeffCheckDigit {

    constructor() {
        this.op = [];
        this.inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]
        this.F = [];

        const { F, op } = this

        op[0] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        op[1] = [1, 2, 3, 4, 0, 6, 7, 8, 9, 5]
        op[2] = [2, 3, 4, 0, 1, 7, 8, 9, 5, 6]
        op[3] = [3, 4, 0, 1, 2, 8, 9, 5, 6, 7]
        op[4] = [4, 0, 1, 2, 3, 9, 5, 6, 7, 8]
        op[5] = [5, 9, 8, 7, 6, 0, 4, 3, 2, 1]
        op[6] = [6, 5, 9, 8, 7, 1, 0, 4, 3, 2]
        op[7] = [7, 6, 5, 9, 8, 2, 1, 0, 4, 3]
        op[8] = [8, 7, 6, 5, 9, 3, 2, 1, 0, 4]
        op[9] = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]

        F[0] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]  // identity permutation
        F[1] = [1, 5, 7, 6, 2, 8, 3, 0, 9, 4]  // "magic" permutation
        for (let i = 2; i < 8; i++) {
            // iterate for remaining permutations
            F[i] = [];
            for (let j = 0; j < 10; j++)
                F[i][j] = F[i - 1][F[1][j]];
        }
    }


    /// <summary>
    /// Calculates the Verhoeff check digit for the given input, then returns
    /// the input with the check digit appended at the end.
    /// </summary>
    /// <param name="input">The long integer for which the check digit is to be calculated.</param>
    /// <returns>The input with the calculated check digit appended.</returns>
    appendCheckDigit(input) {
        const intArray = Array.from(input.toString()).map(Number)
        const resultArray = this._AppendCheckDigit(intArray);
        return Number(resultArray.join(''));
    }

    /// <summary>
    /// Verifies that a given integer has a valid Verhoeff check digit as the last digit.
    /// </summary>
    /// <param name="input">The integer for which the check digit is to be checked. The check digit is the last digit in the input.</param>
    /// <returns>Returns true if the last digit of the input is the valid check digit for
    /// the input. Otherwise returns false.</returns>
    check(input) {
        return this._Check(Array.from(input.toString()).map(Number));
    }

    _AppendCheckDigit(input) {
        const checkDigit = this._CalculateCheckDigit(input);
        const copy = [...input]
        copy.push(checkDigit)

        return copy;
    }

    _CalculateCheckDigit(input) {
        // First we need to reverse the order of the input digits
        const { F, op, inv } = this
        const reversedInput = []
        for (let i = 0; i < input.length; i++)
            reversedInput[i] = input[input.length - (i + 1)];

        let check = 0;
        for (let i = 0; i < reversedInput.length; i++)
            check = op[check][F[(i + 1) % 8][reversedInput[i]]];
        let checkDigit = inv[check];

        return checkDigit;
    }

    _Check(input) {
        const { F, op } = this

        // First we need to reverse the order of the input digits
        const reversedInput = [];
        for (let i = 0; i < input.length; i++)
            reversedInput[i] = input[input.length - (i + 1)];

        let check = 0;
        for (let i = 0; i < reversedInput.length; i++)
            check = op[check][F[i % 8][reversedInput[i]]];

        return (check == 0);
    }

    generateUnid() {
        const result = []

        for (let i = 0; i < 11; i++) {
            result.push(this._randBetween(1, 9).toString())
        }

        const resultWVerhoeff = this.appendCheckDigit(parseInt(result.join('')))
        return resultWVerhoeff
    }

    _randBetween(minimum, maximum) {
        return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    }

}


