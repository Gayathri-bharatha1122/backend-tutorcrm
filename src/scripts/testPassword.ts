import bcrypt from 'bcryptjs';

async function main() {
  const hash = "$2a$10$q.zIhRmLCigHef9ciIBQhea7uXu3fGROk0hcoFtnLdNLX07Diixr.";
  const match = await bcrypt.compare('12345678', hash);
  console.log('Matches 12345678:', match);

  // Let's also check if it matches student123
  const matchStudent = await bcrypt.compare('student123', hash);
  console.log('Matches student123:', matchStudent);
}

main().catch(console.error);
