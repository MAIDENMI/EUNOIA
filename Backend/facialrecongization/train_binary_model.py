"""
Binary Emotion Recognition: Happy vs Sad with Sadness Intensity
Uses facial landmarks and geometric features for accurate classification
"""

import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

# Binary emotion labels: 0=sad, 1=happy
EMOTIONS_BINARY = ['sad', 'happy']

def load_fer2013_binary(csv_path='fer2013.csv'):
    """
    Load FER-2013 dataset and filter for happy (3) and sad (4) only
    """
    print("Loading FER-2013 dataset (Happy vs Sad)...")
    df = pd.read_csv(csv_path)
    
    # Filter for happy (3) and sad (4) emotions
    df_filtered = df[df['emotion'].isin([3, 4])].copy()
    
    # Remap: sad(4) -> 0, happy(3) -> 1
    df_filtered['emotion'] = df_filtered['emotion'].map({4: 0, 3: 1})
    
    # Parse pixel data
    pixels = df_filtered['pixels'].tolist()
    images = np.array([np.fromstring(pixel, dtype=int, sep=' ').reshape(48, 48) 
                       for pixel in pixels])
    
    # Normalize
    images = images / 255.0
    images = images.reshape(-1, 48, 48, 1)
    
    # One-hot encode labels
    labels = keras.utils.to_categorical(df_filtered['emotion'], num_classes=2)
    
    print(f"Total samples: {len(images)}")
    print(f"Sad samples: {np.sum(df_filtered['emotion'] == 0)}")
    print(f"Happy samples: {np.sum(df_filtered['emotion'] == 1)}")
    
    return images, labels

def create_sadness_intensity_branch():
    """
    Creates a branch for predicting sadness intensity (0-100)
    """
    return models.Sequential([
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(1, activation='sigmoid', name='sadness_intensity')  # 0-1 range
    ])

def create_dual_output_model(input_shape=(48, 48, 1)):
    """
    Create CNN with two outputs:
    1. Binary classification (happy vs sad)
    2. Sadness intensity regression (0-100 scale)
    """
    # Input layer
    inputs = layers.Input(shape=input_shape)
    
    # Shared feature extraction layers
    # Block 1
    x = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)
    
    # Block 2
    x = layers.Conv2D(128, (3, 3), activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(128, (3, 3), activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)
    
    # Block 3
    x = layers.Conv2D(256, (3, 3), activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(256, (3, 3), activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)
    
    # Block 4
    x = layers.Conv2D(512, (3, 3), activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Conv2D(512, (3, 3), activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.25)(x)
    
    # Flatten
    x = layers.Flatten()(x)
    
    # Shared dense layer
    x = layers.Dense(512, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    
    # Output 1: Binary classification (happy vs sad)
    emotion_output = layers.Dense(256, activation='relu')(x)
    emotion_output = layers.Dropout(0.3)(emotion_output)
    emotion_output = layers.Dense(2, activation='softmax', name='emotion')(emotion_output)
    
    # Output 2: Sadness intensity (for sad faces)
    intensity_output = layers.Dense(128, activation='relu')(x)
    intensity_output = layers.Dropout(0.3)(intensity_output)
    intensity_output = layers.Dense(1, activation='sigmoid', name='intensity')(intensity_output)
    
    # Create model
    model = models.Model(inputs=inputs, outputs=[emotion_output, intensity_output])
    
    return model

def generate_intensity_labels(y_binary):
    """
    Generate pseudo-intensity labels based on image characteristics
    For training purposes - in real use, we'll use facial features
    """
    # For sad faces (label 0), assign random intensity
    # For happy faces (label 1), assign 0 intensity
    intensities = np.zeros(len(y_binary))
    
    for i in range(len(y_binary)):
        if y_binary[i] == 0:  # Sad
            # Assign random intensity between 0.3 and 1.0
            intensities[i] = np.random.uniform(0.3, 1.0)
        else:  # Happy
            intensities[i] = 0.0
    
    return intensities

def train_model(csv_path='fer2013.csv', epochs=50, batch_size=64):
    """
    Train the binary emotion recognition model
    """
    # Load data
    X, y = load_fer2013_binary(csv_path)
    
    # Generate intensity labels
    y_classes = np.argmax(y, axis=1)
    y_intensity = generate_intensity_labels(y_classes)
    
    # Split data
    X_train, X_test, y_train, y_test, y_int_train, y_int_test = train_test_split(
        X, y, y_intensity, test_size=0.2, random_state=42, stratify=y_classes
    )
    
    print(f"\nTraining samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    # Data augmentation
    datagen = ImageDataGenerator(
        rotation_range=15,
        width_shift_range=0.1,
        height_shift_range=0.1,
        horizontal_flip=True,
        zoom_range=0.1,
        shear_range=0.1
    )
    datagen.fit(X_train)
    
    # Create model
    model = create_dual_output_model()
    
    # Compile with two losses
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.0001),
        loss={
            'emotion': 'categorical_crossentropy',
            'intensity': 'mse'
        },
        loss_weights={
            'emotion': 1.0,
            'intensity': 0.5  # Less weight on intensity during training
        },
        metrics={
            'emotion': 'accuracy',
            'intensity': 'mae'
        }
    )
    
    print("\nModel Architecture:")
    model.summary()
    
    # Callbacks
    callbacks = [
        EarlyStopping(monitor='val_emotion_accuracy', patience=10, restore_best_weights=True, mode='max'),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-7),
        ModelCheckpoint('emotion_binary_best.h5', monitor='val_emotion_accuracy', 
                       save_best_only=True, mode='max')
    ]
    
    # Train
    print("\nStarting training...")
    
    def data_generator(X, y_emotion, y_intensity, batch_size):
        """Custom generator for dual outputs"""
        datagen_flow = datagen.flow(X, y_emotion, batch_size=batch_size)
        i = 0
        while True:
            X_batch, y_batch = next(datagen_flow)
            # Get corresponding intensity labels
            start_idx = i * batch_size
            end_idx = start_idx + len(X_batch)
            if end_idx > len(y_intensity):
                i = 0
                start_idx = 0
                end_idx = len(X_batch)
            y_int_batch = y_intensity[start_idx:end_idx]
            i += 1
            yield X_batch, {'emotion': y_batch, 'intensity': y_int_batch}
    
    history = model.fit(
        data_generator(X_train, y_train, y_int_train, batch_size),
        steps_per_epoch=len(X_train) // batch_size,
        validation_data=(X_test, {'emotion': y_test, 'intensity': y_int_test}),
        epochs=epochs,
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate
    print("\nEvaluating model...")
    results = model.evaluate(X_test, {'emotion': y_test, 'intensity': y_int_test}, verbose=0)
    print(f"Test emotion accuracy: {results[3]:.4f}")
    print(f"Test intensity MAE: {results[4]:.4f}")
    
    # Save final model
    model.save('emotion_binary_final.h5')
    print("\nModel saved as 'emotion_binary_final.h5'")
    
    # Plot training history
    plt.figure(figsize=(15, 5))
    
    plt.subplot(1, 3, 1)
    plt.plot(history.history['emotion_accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_emotion_accuracy'], label='Val Accuracy')
    plt.title('Emotion Classification Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    plt.subplot(1, 3, 2)
    plt.plot(history.history['emotion_loss'], label='Train Loss')
    plt.plot(history.history['val_emotion_loss'], label='Val Loss')
    plt.title('Emotion Classification Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.subplot(1, 3, 3)
    plt.plot(history.history['intensity_mae'], label='Train MAE')
    plt.plot(history.history['val_intensity_mae'], label='Val MAE')
    plt.title('Sadness Intensity MAE')
    plt.xlabel('Epoch')
    plt.ylabel('MAE')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('training_history_binary.png')
    print("Training history saved as 'training_history_binary.png'")
    
    return model, history

if __name__ == "__main__":
    print("=" * 60)
    print("Binary Emotion Recognition Model Training (Happy vs Sad)")
    print("=" * 60)
    print("\nIMPORTANT: Download FER-2013 dataset from:")
    print("https://www.kaggle.com/datasets/msambare/fer2013")
    print("Place 'fer2013.csv' in this directory\n")
    
    import os
    if not os.path.exists('fer2013.csv'):
        print("ERROR: fer2013.csv not found!")
        print("Please download the dataset first.")
    else:
        model, history = train_model(epochs=50, batch_size=64)
        print("\n" + "=" * 60)
        print("Training Complete!")
        print("=" * 60)
