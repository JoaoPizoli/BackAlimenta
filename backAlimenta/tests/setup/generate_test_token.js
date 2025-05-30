const generateToken = require('./src/utils/generateToken');

// Generate a token for patient ID 6 (our test patient)
const token = generateToken({ id: 6, tipo: 'paciente' });
console.log('Token for patient ID 6:');
console.log(token);

// Generate a token for nutricionista ID 1
const nutriToken = generateToken({ id: 1, tipo: 'nutri' });
console.log('\nToken for nutricionista ID 1:');
console.log(nutriToken);
