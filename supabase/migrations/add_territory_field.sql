-- Add territory field to submissions table
ALTER TABLE submissions 
ADD COLUMN territory VARCHAR(50);

-- Create index on territory for better query performance
CREATE INDEX idx_submissions_territory ON submissions(territory);

-- Update existing submissions with territory data based on username
UPDATE submissions 
SET territory = 'St. Ann' 
WHERE username = 'rogimon';

UPDATE submissions 
SET territory = 'Kingston' 
WHERE username = 'Tatiana_1';

UPDATE submissions 
SET territory = 'Portland' 
WHERE username = 'charms';

UPDATE submissions 
SET territory = 'St. Mary' 
WHERE username = 'Chala';

-- Add comment to document the field
COMMENT ON COLUMN submissions.territory IS 'Jamaican parish/territory where the business is located';