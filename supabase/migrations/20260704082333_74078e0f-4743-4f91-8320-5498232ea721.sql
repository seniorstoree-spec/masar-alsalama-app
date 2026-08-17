
CREATE POLICY "auth read violation-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'violation-images');

CREATE POLICY "auth upload violation-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'violation-images');

CREATE POLICY "auth update violation-images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'violation-images');

CREATE POLICY "auth delete violation-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'violation-images');
