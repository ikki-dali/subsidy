-- jgrants_idカラムの長さを拡張（スクレイピング対応）
ALTER TABLE subsidies 
ALTER COLUMN jgrants_id TYPE VARCHAR(100);

-- nameカラムも拡張
ALTER TABLE subsidies 
ALTER COLUMN name TYPE VARCHAR(100);
